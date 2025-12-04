import { useState, useEffect, useCallback } from 'react'
import { FlatList, RefreshControl, View, Alert, Linking, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'

import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Spinner } from '@/components/ui/spinner'

import { useUser } from '../../hooks/useUser'
import {
    getFiles,
    createFolder,
    uploadFile,
    reuploadFile,
    updateFile,
    deleteFile,
    getDownloadUrl,
    searchFiles,
    ApiError,
    ErrorType,
} from '../../services/vaultService'

import FileItem from '../../components/FileItem'
import EmptyState from '../../components/EmptyState'
import SearchBar from '../../components/SearchBar'
import FolderBreadcrumbs from '../../components/FolderBreadcrumbs'
import CreateFolderModal from '../../components/CreateFolderModal'
import RenameModal from '../../components/RenameModal'
import ShareFileModal from '../../components/ShareFileModal'
import FAB from '../../components/FAB'

const Files = () => {
    const { user, loading: authLoading } = useUser()

    // State
    const [files, setFiles] = useState([])
    const [folderStack, setFolderStack] = useState([]) // Array of { id, name }
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchMode, setIsSearchMode] = useState(false)
    const [searchResults, setSearchResults] = useState([])

    // Modal states
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [showRename, setShowRename] = useState(false)
    const [showShare, setShowShare] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Current folder ID
    const currentFolderId = folderStack.length > 0
        ? folderStack[folderStack.length - 1].id
        : null

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/(auth)/login')
        }
    }, [user, authLoading])

    // Load files when folder changes
    useEffect(() => {
        if (user && !isSearchMode) {
            loadFiles()
        }
    }, [user, currentFolderId, isSearchMode])

    const loadFiles = async () => {
        try {
            setLoading(true)
            setError(null)
            // Load only own files (shared=false), not files shared by others
            const data = await getFiles(currentFolderId, false)
            setFiles(data || [])
        } catch (err) {
            console.error('Failed to load files:', err)
            setError(err.message || 'Не удалось загрузить файлы')
            if (err.type === ErrorType.UNAUTHORIZED) {
                router.replace('/(auth)/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        if (isSearchMode && searchQuery) {
            await handleSearch(searchQuery)
        } else {
            await loadFiles()
        }
        setRefreshing(false)
    }, [isSearchMode, searchQuery, currentFolderId])

    // ========== Navigation ==========

    const handleItemPress = (item) => {
        if (item.is_folder) {
            // Navigate into folder
            setFolderStack([...folderStack, { id: item.id, name: item.name }])
            setIsSearchMode(false)
            setSearchQuery('')
        } else {
            // For files, could show preview or download
            handleDownload(item)
        }
    }

    const handleBreadcrumbNavigate = (item, index) => {
        if (index === 0) {
            // Root
            setFolderStack([])
        } else {
            // Navigate to specific folder in stack
            setFolderStack(folderStack.slice(0, index))
        }
        setIsSearchMode(false)
        setSearchQuery('')
    }

    // ========== Search ==========

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setIsSearchMode(false)
            setSearchResults([])
            return
        }

        setIsSearchMode(true)
        setLoading(true)
        try {
            const results = await searchFiles(query)
            setSearchResults(results || [])
        } catch (err) {
            console.error('Search failed:', err)
            Alert.alert('Ошибка', 'Не удалось выполнить поиск')
        } finally {
            setLoading(false)
        }
    }

    const handleSearchClear = () => {
        setIsSearchMode(false)
        setSearchResults([])
        setSearchQuery('')
    }

    // ========== Create Folder ==========

    const handleCreateFolder = async (name) => {
        setIsProcessing(true)
        try {
            await createFolder(name, currentFolderId)
            setShowCreateFolder(false)
            await loadFiles()
        } catch (err) {
            Alert.alert('Ошибка', err.message || 'Не удалось создать папку')
        } finally {
            setIsProcessing(false)
        }
    }

    // ========== Upload File ==========

    const handleUploadFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
            })

            if (result.canceled) return

            const file = result.assets[0]
            // Decode URI-encoded filename (e.g. Russian characters)
            const fileName = decodeURIComponent(file.name)
            setIsProcessing(true)

            try {
                await uploadFile(
                    file.uri,
                    fileName,
                    file.mimeType || 'application/octet-stream',
                    currentFolderId
                )
                await loadFiles()
                Alert.alert('Успешно', 'Файл загружен')
            } catch (err) {
                Alert.alert('Ошибка', err.message || 'Не удалось загрузить файл')
            } finally {
                setIsProcessing(false)
            }
        } catch (err) {
            console.error('Document picker error:', err)
        }
    }

    // ========== Reupload File ==========

    const handleReupload = async (item) => {
        if (item.is_folder) return

        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true,
            })

            if (result.canceled) return

            const file = result.assets[0]
            const fileName = decodeURIComponent(file.name)
            setIsProcessing(true)

            try {
                await reuploadFile(
                    item.id,
                    file.uri,
                    fileName,
                    file.mimeType || 'application/octet-stream'
                )
                if (isSearchMode) {
                    await handleSearch(searchQuery)
                } else {
                    await loadFiles()
                }
                Alert.alert('Успешно', 'Файл заменён')
            } catch (err) {
                Alert.alert('Ошибка', err.message || 'Не удалось заменить файл')
            } finally {
                setIsProcessing(false)
            }
        } catch (err) {
            console.error('Document picker error:', err)
        }
    }

    // ========== Download File ==========

    const handleDownload = async (item) => {
        if (item.is_folder) return

        try {
            setIsProcessing(true)
            const downloadUrl = await getDownloadUrl(item.id)

            if (downloadUrl) {
                // Download to cache directory
                const fileUri = FileSystem.cacheDirectory + item.name
                const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri)

                if (downloadResult.status === 200) {
                    // Check if sharing is available
                    const canShare = await Sharing.isAvailableAsync()
                    if (canShare) {
                        await Sharing.shareAsync(downloadResult.uri)
                    } else {
                        Alert.alert('Скачано', `Файл сохранен: ${item.name}`)
                    }
                } else {
                    throw new Error(`Download failed with status ${downloadResult.status}`)
                }
            } else {
                throw new Error('No download URL received')
            }
        } catch (err) {
            console.error('Download error:', err)
            Alert.alert('Ошибка', 'Не удалось скачать файл')
        } finally {
            setIsProcessing(false)
        }
    }

    // ========== Rename ==========

    const handleRenamePress = (item) => {
        setSelectedItem(item)
        setShowRename(true)
    }

    const handleRename = async (item, newName) => {
        setIsProcessing(true)
        try {
            await updateFile(item.id, { name: newName })
            setShowRename(false)
            setSelectedItem(null)
            if (isSearchMode) {
                await handleSearch(searchQuery)
            } else {
                await loadFiles()
            }
        } catch (err) {
            Alert.alert('Ошибка', err.message || 'Не удалось переименовать')
        } finally {
            setIsProcessing(false)
        }
    }

    // ========== Delete ==========

    const handleDelete = async (item) => {
        setIsProcessing(true)
        try {
            await deleteFile(item.id)
            if (isSearchMode) {
                await handleSearch(searchQuery)
            } else {
                await loadFiles()
            }
        } catch (err) {
            if (err.message?.includes('not empty') || err.status === 400) {
                Alert.alert(
                    'Невозможно удалить',
                    'Папка не пуста. Сначала удалите все файлы внутри папки.'
                )
            } else {
                Alert.alert('Ошибка', err.message || 'Не удалось удалить')
            }
        } finally {
            setIsProcessing(false)
        }
    }

    // ========== Share ==========

    const handleSharePress = (item) => {
        setSelectedItem(item)
        setShowShare(true)
    }

    const handleShareSuccess = () => {
        // Reload files to reflect any changes
        loadFiles()
    }

    // ========== Move (simplified - just shows info) ==========

    const handleMove = (item) => {
        Alert.alert(
            'Перемещение',
            'Функция перемещения файлов будет доступна в следующей версии'
        )
    }

    // ========== Render ==========

    if (authLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <Spinner size="large" color="grey" />
                <Text className="mt-4">Загрузка...</Text>
            </SafeAreaView>
        )
    }

    if (!user) {
        return null
    }

    const displayFiles = isSearchMode ? searchResults : files

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <VStack className="flex-1 px-4">
                {/* Search Bar */}
                <View className="py-3">
                    <SearchBar
                        placeholder="Поиск файлов..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSearch={handleSearch}
                        onClear={handleSearchClear}
                    />
                </View>

                {/* Breadcrumbs with refresh button (hidden in search mode) */}
                {!isSearchMode && (
                    <HStack className="items-center justify-between">
                        <View className="flex-1">
                            <FolderBreadcrumbs
                                folderStack={folderStack}
                                onNavigate={handleBreadcrumbNavigate}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleRefresh}
                            disabled={loading || refreshing}
                            className="p-2"
                        >
                            <Ionicons
                                name="refresh-outline"
                                size={22}
                                color={loading || refreshing ? '#9CA3AF' : '#3B82F6'}
                            />
                        </TouchableOpacity>
                    </HStack>
                )}

                {/* Search mode indicator */}
                {isSearchMode && (
                    <Text className="text-sm text-gray-500 py-2">
                        Результаты поиска: {searchResults.length}
                    </Text>
                )}

                {/* Loading indicator */}
                {loading && !refreshing && (
                    <View className="flex-1 justify-center items-center">
                        <Spinner size="large" color="grey" />
                    </View>
                )}

                {/* Error state */}
                {!loading && error && (
                    <EmptyState
                        icon="alert-circle-outline"
                        title="Ошибка"
                        description={error}
                        iconColor="#EF4444"
                    />
                )}

                {/* Empty state */}
                {!loading && !error && displayFiles.length === 0 && (
                    <EmptyState
                        icon={isSearchMode ? 'search-outline' : 'folder-open-outline'}
                        title={isSearchMode ? 'Ничего не найдено' : 'Папка пуста'}
                        description={
                            isSearchMode
                                ? 'Попробуйте изменить поисковый запрос'
                                : 'Загрузите файлы или создайте папку'
                        }
                    />
                )}

                {/* File list */}
                {!loading && !error && displayFiles.length > 0 && (
                    <FlatList
                        data={displayFiles}
                        renderItem={({ item }) => (
                            <FileItem
                                item={item}
                                onPress={handleItemPress}
                                onDownload={handleDownload}
                                onReupload={handleReupload}
                                onRename={handleRenamePress}
                                onMove={handleMove}
                                onDelete={handleDelete}
                                onShare={handleSharePress}
                            />
                        )}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                            />
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </VStack>

            {/* FAB (hidden in search mode and when processing) */}
            {!isSearchMode && !isProcessing && (
                <FAB
                    onUploadFile={handleUploadFile}
                    onCreateFolder={() => setShowCreateFolder(true)}
                />
            )}

            {/* Processing overlay */}
            {isProcessing && (
                <View className="absolute inset-0 bg-black/30 justify-center items-center">
                    <View className="bg-white rounded-xl p-6">
                        <Spinner size="large" />
                        <Text className="mt-3">Обработка...</Text>
                    </View>
                </View>
            )}

            {/* Modals */}
            <CreateFolderModal
                visible={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                onSubmit={handleCreateFolder}
                isLoading={isProcessing}
            />

            <RenameModal
                visible={showRename}
                item={selectedItem}
                onClose={() => {
                    setShowRename(false)
                    setSelectedItem(null)
                }}
                onSubmit={handleRename}
                isLoading={isProcessing}
            />

            <ShareFileModal
                visible={showShare}
                item={selectedItem}
                onClose={() => {
                    setShowShare(false)
                    setSelectedItem(null)
                }}
                onSuccess={handleShareSuccess}
            />
        </SafeAreaView>
    )
}

export default Files
