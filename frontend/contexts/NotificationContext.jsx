import { createContext, useState, useEffect, useCallback } from 'react'
import { useUser } from '../hooks/useUser'
import {
    getNotifications,
    deleteNotification,
    clearAllNotifications,
    setOnUnauthorizedNotifications,
} from '../services/notificationService'

export const NotificationContext = createContext()

export function NotificationProvider({ children }) {
    const { user } = useUser()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        setOnUnauthorizedNotifications(() => {
            setNotifications([])
        })
    }, [])

    useEffect(() => {
        if (user) {
            loadNotifications()
        } else {
            setNotifications([])
        }
    }, [user])

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getNotifications()
            setNotifications(data || [])
        } catch (err) {
            setError(err.message)
            console.error('Failed to load notifications:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    const removeNotification = useCallback(async (notificationId) => {
        try {
            await deleteNotification(notificationId)
            setNotifications(prev =>
                prev.filter(n => n.id !== notificationId)
            )
        } catch (err) {
            console.error('Failed to delete notification:', err)
            throw err
        }
    }, [])

    const clearAll = useCallback(async () => {
        try {
            await clearAllNotifications()
            setNotifications([])
        } catch (err) {
            console.error('Failed to clear notifications:', err)
            throw err
        }
    }, [])

    return (
        <NotificationContext.Provider value={{
            notifications,
            count: notifications.length,
            loading,
            error,
            refresh: loadNotifications,
            remove: removeNotification,
            clearAll,
        }}>
            {children}
        </NotificationContext.Provider>
    )
}



