import { useState, useCallback } from 'react'
import { FlatList, RefreshControl, View, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Spinner } from '@/components/ui/spinner'
import { Button, ButtonText } from '@/components/ui/button'

import { useNotifications } from '../../hooks/useNotifications'
import { formatNotificationDate, NotificationType } from '../../services/notificationService'
import EmptyState from '../../components/EmptyState'

const NotificationItem = ({ item, onDelete }) => {
    const [deleting, setDeleting] = useState(false)

    const getIcon = () => {
        switch (item.type) {
            case NotificationType.FILE_SHARED:
                return { name: 'share-outline', color: '#3B82F6' }
            default:
                return { name: 'notifications-outline', color: '#6B7280' }
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await onDelete(item.id)
        } catch (err) {
            Alert.alert('Ошибка', 'Не удалось удалить уведомление')
        } finally {
            setDeleting(false)
        }
    }

    const icon = getIcon()

    return (
        <HStack className="items-start py-4 px-1">
            <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: `${icon.color}15` }}
            >
                <Ionicons name={icon.name} size={20} color={icon.color} />
            </View>
            <VStack className="ml-3 flex-1 pr-2">
                <Text className="text-base" numberOfLines={3}>
                    {item.payload}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                    {formatNotificationDate(item.created_at)}
                </Text>
            </VStack>
            <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                className="p-2"
            >
                {deleting ? (
                    <Spinner size="small" color="grey" />
                ) : (
                    <Ionicons name="close-circle-outline" size={22} color="#9CA3AF" />
                )}
            </TouchableOpacity>
        </HStack>
    )
}

const Notifications = () => {
    const {
        notifications,
        loading,
        error,
        refresh,
        remove,
        clearAll,
    } = useNotifications()

    const [refreshing, setRefreshing] = useState(false)
    const [clearing, setClearing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await refresh()
        setRefreshing(false)
    }, [refresh])

    const handleClearAll = () => {
        if (notifications.length === 0) return

        Alert.alert(
            'Очистить уведомления',
            'Удалить все уведомления?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        setClearing(true)
                        try {
                            await clearAll()
                        } catch (err) {
                            Alert.alert('Ошибка', 'Не удалось очистить уведомления')
                        } finally {
                            setClearing(false)
                        }
                    },
                },
            ]
        )
    }

    const renderItem = ({ item }) => (
        <NotificationItem item={item} onDelete={remove} />
    )

    const renderSeparator = () => (
        <View className="h-px bg-gray-100" />
    )

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <VStack className="flex-1 px-4">
                <HStack className="items-center justify-between py-4">
                    <Heading>Уведомления</Heading>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll} disabled={clearing}>
                            {clearing ? (
                                <Spinner size="small" color="grey" />
                            ) : (
                                <Text className="text-sm text-blue-500">Очистить</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </HStack>

                {/* Loading */}
                {loading && !refreshing && notifications.length === 0 && (
                    <View className="flex-1 justify-center items-center">
                        <Spinner size="large" color="grey" />
                    </View>
                )}

                {/* Error */}
                {!loading && error && notifications.length === 0 && (
                    <EmptyState
                        icon="alert-circle-outline"
                        title="Ошибка"
                        description={error}
                        iconColor="#EF4444"
                    />
                )}

                {/* Empty state */}
                {!loading && !error && notifications.length === 0 && (
                    <EmptyState
                        icon="notifications-off-outline"
                        title="Нет уведомлений"
                        description="Новые уведомления будут появляться здесь"
                    />
                )}

                {/* Notification list */}
                {notifications.length > 0 && (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        ItemSeparatorComponent={renderSeparator}
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
            </VStack>
        </SafeAreaView>
    )
}

export default Notifications



