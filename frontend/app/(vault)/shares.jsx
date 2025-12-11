import { useState, useEffect, useCallback } from 'react'
import { FlatList, RefreshControl, View, Alert, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'

import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Spinner } from '@/components/ui/spinner'
import {
    Menu,
    MenuItem,
    MenuItemLabel,
    MenuSeparator,
} from '@/components/ui/menu'

import { useUser } from '../../hooks/useUser'
import {
    getFiles,
    getDownloadUrl,
    getFileAccess,
    reuploadFile,
    updateFile,
    formatFileSize,
    formatDate,
    getFileIcon,
    ErrorType,
} from '../../services/vaultService'

import EmptyState from '../../components/EmptyState'
import RenameModal from '../../components/RenameModal'

const SharedFileItem = ({ item, onPress, onDownload, onReupload, onRename, hasWriteAccess = false }) => {
    const isFolder = item.is_folder
    const iconName = isFolder ? 'folder' : getFileIcon(false, item.mime_type)
    const iconColor = isFolder ? '#FFC107' : '#666'

    return (
        <TouchableOpacity onPress={() => onPress?.(item)} activeOpacity={0.7}>
            <HStack className="items-center py-4 px-1">
                <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
                    <Ionicons name={iconName} size={24} color={iconColor} />
                </View>
                <VStack className="ml-3 flex-1 pr-2">
                    <Text className="text-base font-medium" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <HStack className="items-center mt-1">
                        <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-500 ml-1">
                            Владелец: {item.owner_username}
                        </Text>
                        {hasWriteAccess ? (
                            <View className="ml-2 px-1.5 py-0.5 bg-blue-100 rounded">
                                <Text className="text-xs text-blue-600">запись</Text>
                            </View>
                        ) : (
                            <View className="ml-2 px-1.5 py-0.5 bg-green-100 rounded">
                                <Text className="text-xs text-green-600">чтение</Text>
                            </View>
                        )
                        }
                    </HStack>
                    <HStack className="items-center mt-0.5">
                        {!isFolder && item.size && (
                            <Text className="text-xs text-gray-400">
                                {formatFileSize(item.size)}
                            </Text>
                        )}
                        {item.created_at && (
                            <Text className="text-xs text-gray-400 ml-2">
                                {formatDate(item.created_at)}
                            </Text>
                        )}
                    </HStack>
                </VStack>
                <Menu
                    trigger={({ ...triggerProps }) => (
                        <TouchableOpacity {...triggerProps} className="p-2">
                            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                >
                    {!isFolder && onDownload && (
                        <MenuItem onPress={() => onDownload(item)}>
                            <Ionicons name="download-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Скачать</MenuItemLabel>
                        </MenuItem>
                    )}

                    {!isFolder && hasWriteAccess && onReupload && (
                        <MenuItem onPress={() => onReupload(item)}>
                            <Ionicons name="cloud-upload-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Заменить файл</MenuItemLabel>
                        </MenuItem>
                    )}

                    {hasWriteAccess && onRename && (
                        <MenuItem onPress={() => onRename(item)}>
                            <Ionicons name="pencil-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Переименовать</MenuItemLabel>
                        </MenuItem>
                    )}
                </Menu>
            </HStack>
            <View className="h-px bg-gray-100" />
        </TouchableOpacity>
    )
}

const Shares = () => {
    const { user, loading: authLoading } = useUser()

    const [sharedFiles, setSharedFiles] = useState([])
    const [filePermissions, setFilePermissions] = useState({}) // { fileId: 'read' | 'write' }
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [downloading, setDownloading] = useState(null) // ID of file being downloaded
    const [isProcessing, setIsProcessing] = useState(false)

    // Modal states
    const [showRename, setShowRename] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/(auth)/login')
        }
    }, [user, authLoading])

    // Load shared files
    useEffect(() => {
        if (user) {
            loadSharedFiles()
        }
    }, [user])

    const loadSharedFiles = async () => {
        try {
            setLoading(true)
            setError(null)
            // Get only files shared with the current user (not owned by them)
            const data = await getFiles(null, true)
            setSharedFiles(data || [])

            // Load permissions for each file
            if (data && data.length > 0 && user) {
                const permissions = {}
                await Promise.all(
                    data.map(async (file) => {
                        try {
                            const accessList = await getFileAccess(file.id)
                            // Find current user's permission
                            const userAccess = accessList.find(
                                (entry) => entry.username === user.username
                            )
                            if (userAccess) {
                                permissions[file.id] = userAccess.permission
                            }
                        } catch (err) {
                            // If we can't get access info, assume read-only
                            console.warn(`Could not get access for file ${file.id}:`, err)
                        }
                    })
                )
                setFilePermissions(permissions)
            }
        } catch (err) {
            console.error('Failed to load shared files:', err)
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
        await loadSharedFiles()
        setRefreshing(false)
    }, [])

    const handleItemPress = (item) => {
        if (item.is_folder) {
            // Navigate to files screen with this folder
            // For simplicity, we'll just show an alert
            Alert.alert(
                'Открыть папку',
                'Перейти к папке в разделе "Файлы"?',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Перейти',
                        onPress: () => {
                            router.push('/(vault)/files')
                        },
                    },
                ]
            )
        } else {
            handleDownload(item)
        }
    }

    const handleDownload = async (item) => {
        if (item.is_folder) return

        try {
            setDownloading(item.id)
            const downloadUrl = await getDownloadUrl(item.id)

            if (downloadUrl) {
                const fileUri = FileSystem.cacheDirectory + item.name
                const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri)

                if (downloadResult.status === 200) {
                    const canShare = await Sharing.isAvailableAsync()
                    if (canShare) {
                        await Sharing.shareAsync(downloadResult.uri)
                    } else {
                        Alert.alert('Скачано', `Файл сохранен: ${item.name}`)
                    }
                } else {
                    throw new Error('Download failed')
                }
            }
        } catch (err) {
            console.error('Download error:', err)
            Alert.alert('Ошибка', 'Не удалось скачать файл')
        } finally {
            setDownloading(null)
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
                await loadSharedFiles()
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
            await loadSharedFiles()
        } catch (err) {
            Alert.alert('Ошибка', err.message || 'Не удалось переименовать')
        } finally {
            setIsProcessing(false)
        }
    }

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

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <VStack className="flex-1 px-4">
                <Heading className="py-4">Доступные мне</Heading>
                <Text className="text-sm text-gray-500 mb-4">
                    Файлы и папки, которыми с вами поделились другие пользователи
                </Text>

                {/* Loading */}
                {loading && !refreshing && (
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                            />
                        }
                    >
                        <Spinner size="large" color="grey" />
                    </ScrollView>
                )}

                {/* Error */}
                {!loading && error && (
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ flex: 1 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                            />
                        }
                    >
                        <EmptyState
                            icon="alert-circle-outline"
                            title="Ошибка"
                            description={error}
                            iconColor="#EF4444"
                        />
                    </ScrollView>
                )}

                {/* Empty state */}
                {!loading && !error && sharedFiles.length === 0 && (
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ flex: 1 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                            />
                        }
                    >
                        <EmptyState
                            icon="share-social-outline"
                            title="Нет доступных файлов"
                            description="Когда кто-то поделится с вами файлом, он появится здесь"
                        />
                    </ScrollView>
                )}

                {/* File list */}
                {!loading && !error && sharedFiles.length > 0 && (
                    <FlatList
                        data={sharedFiles}
                        renderItem={({ item }) => (
                            <SharedFileItem
                                item={item}
                                onPress={handleItemPress}
                                onDownload={handleDownload}
                                onReupload={handleReupload}
                                onRename={handleRenamePress}
                                hasWriteAccess={filePermissions[item.id] === 'write'}
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
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}

                {/* Download overlay */}
                {downloading && (
                    <View className="absolute inset-0 bg-black/30 justify-center items-center">
                        <View className="bg-white rounded-xl p-6">
                            <Spinner size="large" />
                            <Text className="mt-3">Скачивание...</Text>
                        </View>
                    </View>
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
            </VStack>

            {/* Modals */}
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
        </SafeAreaView>
    )
}

export default Shares
