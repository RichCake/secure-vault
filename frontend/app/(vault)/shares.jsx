import { useState, useEffect, useCallback } from 'react'
import { FlatList, RefreshControl, View, Alert, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'

import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Spinner } from '@/components/ui/spinner'

import { useUser } from '../../hooks/useUser'
import {
    getFiles,
    getDownloadUrl,
    formatFileSize,
    formatDate,
    getFileIcon,
    ErrorType,
} from '../../services/vaultService'

import EmptyState from '../../components/EmptyState'

const SharedFileItem = ({ item, onPress, onDownload }) => {
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
                {!isFolder && (
                    <TouchableOpacity
                        onPress={() => onDownload?.(item)}
                        className="p-2"
                    >
                        <Ionicons name="download-outline" size={22} color="#3B82F6" />
                    </TouchableOpacity>
                )}
            </HStack>
            <View className="h-px bg-gray-100" />
        </TouchableOpacity>
    )
}

const Shares = () => {
    const { user, loading: authLoading } = useUser()

    const [sharedFiles, setSharedFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState(null)
    const [downloading, setDownloading] = useState(null) // ID of file being downloaded

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
                    <View className="flex-1 justify-center items-center">
                        <Spinner size="large" color="grey" />
                    </View>
                )}

                {/* Error */}
                {!loading && error && (
                    <EmptyState
                        icon="alert-circle-outline"
                        title="Ошибка"
                        description={error}
                        iconColor="#EF4444"
                    />
                )}

                {/* Empty state */}
                {!loading && !error && sharedFiles.length === 0 && (
                    <EmptyState
                        icon="share-social-outline"
                        title="Нет доступных файлов"
                        description="Когда кто-то поделится с вами файлом, он появится здесь"
                    />
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
            </VStack>
        </SafeAreaView>
    )
}

export default Shares
