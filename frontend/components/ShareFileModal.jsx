import { useState, useEffect } from 'react'
import { Modal, View, KeyboardAvoidingView, Platform, FlatList, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Input, InputField } from '@/components/ui/input'
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { searchUsers, getFileAccess, shareFile, revokeAccess, ApiError } from '../services/vaultService'
import { createNotification, NotificationType } from '../services/notificationService'
import { useUser } from '../hooks/useUser'

const ShareFileModal = ({
    visible,
    item,
    onClose,
    onSuccess,
}) => {
    const { user: currentUser } = useUser()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [accessList, setAccessList] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [isLoadingAccess, setIsLoadingAccess] = useState(false)
    const [isSharing, setIsSharing] = useState(false)
    const [selectedPermission, setSelectedPermission] = useState('read')

    useEffect(() => {
        if (visible && item) {
            loadAccessList()
        }
    }, [visible, item])

    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timer = setTimeout(() => {
                performSearch()
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setSearchResults([])
        }
    }, [searchQuery])

    const loadAccessList = async () => {
        if (!item) return
        setIsLoadingAccess(true)
        try {
            const access = await getFileAccess(item.id)
            setAccessList(access)
        } catch (error) {
            console.error('Failed to load access list:', error)
        } finally {
            setIsLoadingAccess(false)
        }
    }

    const performSearch = async () => {
        setIsSearching(true)
        try {
            const users = await searchUsers(searchQuery)
            // Filter out users who already have access
            const accessUserIds = accessList.map(a => a.user_id)
            const filtered = users.filter(u => !accessUserIds.includes(u.id))
            setSearchResults(filtered)
        } catch (error) {
            console.error('Search failed:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    const handleShare = async (user) => {
        setIsSharing(true)
        try {
            await shareFile(item.id, user.username, selectedPermission)
            
            // Создаём уведомление для получателя
            try {
                const permissionText = selectedPermission === 'write' ? 'с правом редактирования' : 'для просмотра'
                const payload = `${currentUser?.username || 'Пользователь'} поделился с вами файлом "${item.name}" ${permissionText}`
                await createNotification(user.id, NotificationType.FILE_SHARED, payload)
            } catch (notifError) {
                // Не прерываем основной flow если уведомление не создалось
                console.warn('Failed to create notification:', notifError)
            }
            
            setSearchQuery('')
            setSearchResults([])
            await loadAccessList()
            onSuccess?.()
        } catch (error) {
            Alert.alert('Ошибка', error.message || 'Не удалось поделиться файлом')
        } finally {
            setIsSharing(false)
        }
    }

    const handleRevoke = async (userId, username) => {
        Alert.alert(
            'Отозвать доступ',
            `Отозвать доступ для ${username}?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Отозвать',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await revokeAccess(item.id, userId)
                            await loadAccessList()
                            onSuccess?.()
                        } catch (error) {
                            Alert.alert('Ошибка', error.message || 'Не удалось отозвать доступ')
                        }
                    },
                },
            ]
        )
    }

    const handleClose = () => {
        setSearchQuery('')
        setSearchResults([])
        setAccessList([])
        onClose?.()
    }

    const renderUserItem = ({ item: user }) => (
        <TouchableOpacity
            onPress={() => handleShare(user)}
            disabled={isSharing}
            className="flex-row items-center py-3 px-2 border-b border-gray-100"
        >
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="person-outline" size={20} color="#3B82F6" />
            </View>
            <Text className="ml-3 flex-1 text-base">{user.username}</Text>
            {isSharing ? (
                <Spinner size="small" />
            ) : (
                <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            )}
        </TouchableOpacity>
    )

    const renderAccessItem = ({ item: access }) => (
        <HStack className="items-center py-3 px-2 border-b border-gray-100">
            <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="person" size={20} color="#666" />
            </View>
            <VStack className="ml-3 flex-1">
                <Text className="text-base">{access.username}</Text>
                <Text className="text-xs text-gray-500">
                    {access.permission === 'write' ? 'Редактирование' : 'Просмотр'}
                </Text>
            </VStack>
            <TouchableOpacity
                onPress={() => handleRevoke(access.user_id, access.username)}
                className="p-2"
            >
                <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
        </HStack>
    )

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end"
            >
                <TouchableOpacity
                    className="flex-1 bg-black/50"
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View className="bg-white rounded-t-3xl max-h-[80%]">
                    <VStack className="p-6">
                        <HStack className="items-center justify-between mb-4">
                            <Heading size="lg">Поделиться</Heading>
                            <TouchableOpacity onPress={handleClose}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </HStack>

                        <Text className="text-sm text-gray-600 mb-4" numberOfLines={1}>
                            {item?.name}
                        </Text>

                        {/* Permission selector */}
                        <HStack className="mb-4 space-x-2">
                            <TouchableOpacity
                                onPress={() => setSelectedPermission('read')}
                                className={`flex-1 py-2 px-3 rounded-lg border ${
                                    selectedPermission === 'read'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200'
                                }`}
                            >
                                <Text className={`text-center ${
                                    selectedPermission === 'read' ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                    Просмотр
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSelectedPermission('write')}
                                className={`flex-1 py-2 px-3 rounded-lg border ${
                                    selectedPermission === 'write'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200'
                                }`}
                            >
                                <Text className={`text-center ${
                                    selectedPermission === 'write' ? 'text-blue-600' : 'text-gray-600'
                                }`}>
                                    Редактирование
                                </Text>
                            </TouchableOpacity>
                        </HStack>

                        {/* Search input */}
                        <Input size="lg" className="mb-4">
                            <Ionicons
                                name="search-outline"
                                size={20}
                                color="#9CA3AF"
                                style={{ marginLeft: 12 }}
                            />
                            <InputField
                                placeholder="Найти пользователя..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {isSearching && <Spinner size="small" style={{ marginRight: 12 }} />}
                        </Input>

                        {/* Search results */}
                        {searchResults.length > 0 && (
                            <VStack className="mb-4">
                                <Text className="text-sm text-gray-500 mb-2">
                                    Результаты поиска ({searchResults.length})
                                </Text>
                                <View style={{ maxHeight: 160 }}>
                                    <FlatList
                                        data={searchResults}
                                        renderItem={renderUserItem}
                                        keyExtractor={item => item.id}
                                        scrollEnabled={true}
                                        nestedScrollEnabled={true}
                                    />
                                </View>
                            </VStack>
                        )}

                        {/* No results message */}
                        {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                            <Text className="text-center text-gray-400 py-2 mb-4">
                                Пользователи не найдены
                            </Text>
                        )}

                        {/* Current access list */}
                        <VStack>
                            <Text className="text-sm text-gray-500 mb-2">
                                Пользователи с доступом
                            </Text>
                            {isLoadingAccess ? (
                                <Spinner size="large" className="py-4" />
                            ) : accessList.length === 0 ? (
                                <Text className="text-center text-gray-400 py-4">
                                    Доступ никому не предоставлен
                                </Text>
                            ) : (
                                <View style={{ maxHeight: 200 }}>
                                    <FlatList
                                        data={accessList}
                                        renderItem={renderAccessItem}
                                        keyExtractor={item => item.user_id}
                                        scrollEnabled={true}
                                        nestedScrollEnabled={true}
                                    />
                                </View>
                            )}
                        </VStack>
                    </VStack>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

export default ShareFileModal

