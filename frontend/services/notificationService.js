import {
    API_CONFIG,
    getApiUrl,
    getNotificationUrl,
} from '../config/api'

let onUnauthorized = null

export const setOnUnauthorizedNotifications = (callback) => {
    onUnauthorized = callback
}

const apiFetch = async (url, options = {}) => {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    }

    try {
        const response = await fetch(url, { ...defaultOptions, ...options })

        if (!response.ok) {
            if (response.status === 401) {
                if (onUnauthorized) {
                    onUnauthorized()
                }
                throw new Error('Сессия истекла. Войдите снова.')
            }
            if (response.status === 404) {
                throw new Error('Уведомление не найдено')
            }
            throw new Error('Ошибка сервера')
        }

        if (response.status === 204) {
            return null
        }

        return await response.json()
    } catch (error) {
        if (error.message) {
            throw error
        }
        throw new Error('Проблемы с подключением к серверу')
    }
}

export const NotificationType = {
    FILE_SHARED: 'file_shared',
}

export const createNotification = async (userId, type, payload) => {
    return apiFetch(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST), {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            type,
            payload,
        }),
    })
}

export const getNotifications = async () => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST)
    return apiFetch(url)
}

export const deleteNotification = async (notificationId) => {
    return apiFetch(getNotificationUrl(notificationId), {
        method: 'DELETE',
    })
}

export const clearAllNotifications = async () => {
    return apiFetch(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST), {
        method: 'DELETE',
    })
}

export const formatNotificationDate = (dateString) => {
    // Добавляем 3 часа для UTC+3
    const date = new Date(new Date(dateString).getTime() + 3 * 60 * 60 * 1000)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays < 7) return `${diffDays} дн. назад`

    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
    })
}

