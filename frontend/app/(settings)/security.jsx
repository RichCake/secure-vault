import { View, TouchableOpacity, Alert, RefreshControl, ScrollView } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { useUser } from '../../hooks/useUser'
import { getSessions, revokeSession, revokeAllSessions, ApiError } from '../../services/vaultService'

// Parse user agent to get readable device info
const parseUserAgent = (userAgent) => {
    if (!userAgent) return { device: 'Неизвестное устройство', icon: 'help-circle-outline' }

    const ua = userAgent.toLowerCase()

    // Detect device type and OS
    let device = ''
    let icon = 'desktop-outline'

    // Mobile detection
    if (ua.includes('iphone')) {
        device = 'iPhone'
        icon = 'phone-portrait-outline'
    } else if (ua.includes('ipad')) {
        device = 'iPad'
        icon = 'tablet-portrait-outline'
    } else if (ua.includes('android')) {
        if (ua.includes('mobile')) {
            device = 'Android Phone'
            icon = 'phone-portrait-outline'
        } else {
            device = 'Android Tablet'
            icon = 'tablet-portrait-outline'
        }
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
        device = 'macOS'
        icon = 'laptop-outline'
    } else if (ua.includes('windows')) {
        device = 'Windows'
        icon = 'desktop-outline'
    } else if (ua.includes('linux')) {
        device = 'Linux'
        icon = 'desktop-outline'
    } else {
        device = 'Устройство'
        icon = 'globe-outline'
    }

    // Detect browser
    let browser = ''
    if (ua.includes('edg/')) {
        browser = 'Edge'
    } else if (ua.includes('chrome') && !ua.includes('edg/')) {
        browser = 'Chrome'
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
        browser = 'Safari'
    } else if (ua.includes('firefox')) {
        browser = 'Firefox'
    } else if (ua.includes('opera') || ua.includes('opr/')) {
        browser = 'Opera'
    }

    if (browser) {
        device = `${browser} на ${device}`
    }

    return { device, icon }
}

// Format date to relative time
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays === 1) return 'Вчера'
    if (diffDays < 7) return `${diffDays} дн. назад`

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
}

// Format full date
const formatFullDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

const SessionItem = ({ session, onRevoke, isRevoking }) => {
    const { device, icon } = parseUserAgent(session.user_agent)

    return (
        <VStack className={`p-4 rounded-lg mb-3 ${session.is_current ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
            <HStack className="items-start justify-between">
                <HStack className="items-center flex-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${session.is_current ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Ionicons
                            name={icon}
                            size={20}
                            color={session.is_current ? '#3B82F6' : '#6B7280'}
                        />
                    </View>
                    <VStack className="ml-3 flex-1">
                        <HStack className="items-center">
                            <Text className="text-base font-medium text-gray-900">{device}</Text>
                            {session.is_current && (
                                <View className="ml-2 px-2 py-0.5 bg-blue-500 rounded">
                                    <Text className="text-xs text-white font-medium">Текущая</Text>
                                </View>
                            )}
                        </HStack>
                        {session.ip_address && (
                            <Text className="text-sm text-gray-500">IP: {session.ip_address}</Text>
                        )}
                        <Text className="text-xs text-gray-400 mt-1">
                            Вход: {formatFullDate(session.created_at)}
                        </Text>
                        <Text className="text-xs text-gray-400">
                            Активность: {formatRelativeTime(session.last_active_at)}
                        </Text>
                    </VStack>
                </HStack>

                {!session.is_current && (
                    <TouchableOpacity
                        onPress={() => onRevoke(session.id)}
                        disabled={isRevoking}
                        className="ml-2 p-2"
                    >
                        {isRevoking ? (
                            <Spinner size="small" color="red" />
                        ) : (
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        )}
                    </TouchableOpacity>
                )}
            </HStack>
        </VStack>
    )
}

const Security = () => {
    const { user, loading: authLoading } = useUser()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [revokingId, setRevokingId] = useState(null)
    const [revokingAll, setRevokingAll] = useState(false)
    const [error, setError] = useState(null)

    const fetchSessions = useCallback(async () => {
        try {
            setError(null)
            const data = await getSessions()
            setSessions(data.sessions || [])
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError('Не удалось загрузить сессии')
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/(auth)/login')
        }
    }, [user, authLoading])

    useEffect(() => {
        if (user) {
            fetchSessions()
        }
    }, [user, fetchSessions])

    const handleRefresh = useCallback(() => {
        setRefreshing(true)
        fetchSessions()
    }, [fetchSessions])

    const handleRevokeSession = async (sessionId) => {
        Alert.alert(
            'Завершить сессию',
            'Устройство будет отключено от аккаунта. Продолжить?',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Завершить',
                    style: 'destructive',
                    onPress: async () => {
                        setRevokingId(sessionId)
                        try {
                            await revokeSession(sessionId)
                            setSessions(prev => prev.filter(s => s.id !== sessionId))
                            Alert.alert('Готово', 'Сессия завершена')
                        } catch (err) {
                            if (err instanceof ApiError) {
                                Alert.alert('Ошибка', err.message)
                            } else {
                                Alert.alert('Ошибка', 'Не удалось завершить сессию')
                            }
                        } finally {
                            setRevokingId(null)
                        }
                    },
                },
            ]
        )
    }

    const handleRevokeAllSessions = () => {
        const otherSessionsCount = sessions.filter(s => !s.is_current).length
        if (otherSessionsCount === 0) {
            Alert.alert('Нет других сессий', 'У вас активна только текущая сессия')
            return
        }

        Alert.alert(
            'Завершить все сессии',
            `Все устройства (${otherSessionsCount}) будут отключены от аккаунта, кроме текущего. Продолжить?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Завершить все',
                    style: 'destructive',
                    onPress: async () => {
                        setRevokingAll(true)
                        try {
                            const result = await revokeAllSessions()
                            setSessions(prev => prev.filter(s => s.is_current))
                            Alert.alert('Готово', `Завершено сессий: ${result.revoked_count}`)
                        } catch (err) {
                            if (err instanceof ApiError) {
                                Alert.alert('Ошибка', err.message)
                            } else {
                                Alert.alert('Ошибка', 'Не удалось завершить сессии')
                            }
                        } finally {
                            setRevokingAll(false)
                        }
                    },
                },
            ]
        )
    }

    if (authLoading || loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <Spinner size="large" color="grey" />
            </SafeAreaView>
        )
    }

    if (!user) {
        return null
    }

    const otherSessionsCount = sessions.filter(s => !s.is_current).length

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
            >
                <VStack className="px-4 py-4">
                    {/* Header with info */}
                    <VStack className="mb-4">
                        <HStack className="items-center mb-2">
                            <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
                            <Heading className="ml-2">Активные сессии</Heading>
                        </HStack>
                        <Text className="text-sm text-gray-500">
                            Здесь отображаются все устройства, на которых выполнен вход в ваш аккаунт.
                            Вы можете завершить любую сессию, кроме текущей.
                        </Text>
                    </VStack>

                    {/* Revoke all button */}
                    {otherSessionsCount > 0 && (
                        <Button
                            action="negative"
                            variant="outline"
                            className="mb-4"
                            onPress={handleRevokeAllSessions}
                            isDisabled={revokingAll}
                        >
                            {revokingAll ? (
                                <ButtonSpinner color="red" />
                            ) : (
                                <>
                                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                                    <ButtonText className="ml-2 text-red-500">
                                        Завершить все другие сессии ({otherSessionsCount})
                                    </ButtonText>
                                </>
                            )}
                        </Button>
                    )}

                    {/* Error state */}
                    {error && (
                        <VStack className="items-center py-8">
                            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                            <Text className="text-red-500 mt-2 text-center">{error}</Text>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onPress={fetchSessions}
                            >
                                <ButtonText>Попробовать снова</ButtonText>
                            </Button>
                        </VStack>
                    )}

                    {/* Sessions list */}
                    {!error && sessions.length === 0 && (
                        <VStack className="items-center py-8">
                            <Ionicons name="desktop-outline" size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 mt-2">Нет активных сессий</Text>
                        </VStack>
                    )}

                    {!error && sessions.length > 0 && (
                        <VStack>
                            {/* Current session first */}
                            {sessions.filter(s => s.is_current).map(session => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                    onRevoke={handleRevokeSession}
                                    isRevoking={revokingId === session.id}
                                />
                            ))}

                            {/* Other sessions */}
                            {otherSessionsCount > 0 && (
                                <Text className="text-sm font-medium text-gray-500 mb-2 mt-2">
                                    Другие устройства
                                </Text>
                            )}
                            {sessions.filter(s => !s.is_current).map(session => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                    onRevoke={handleRevokeSession}
                                    isRevoking={revokingId === session.id}
                                />
                            ))}
                        </VStack>
                    )}

                    {/* Info footer */}
                    <VStack className="mt-6 p-4 bg-amber-50 rounded-lg">
                        <HStack className="items-start">
                            <Ionicons name="information-circle" size={20} color="#F59E0B" />
                            <Text className="text-sm text-amber-700 ml-2 flex-1">
                                Если вы видите незнакомое устройство, немедленно завершите его сессию и смените пароль.
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Security
