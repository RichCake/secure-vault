export const API_CONFIG = {
    BASE_URL: 'http://10.0.183.55:8000',

    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            CHANGE_PASSWORD: '/auth/change-password',
            USERS_SEARCH: '/auth/users/search',
            SESSIONS: '/auth/sessions',
        },
        USER: {
            ME: '/me',
        },
        VAULT: {
            FOLDERS: '/vault/folders',
            UPLOAD: '/vault/upload',
            FILES: '/vault/files',
            SEARCH: '/vault/search',
        },
        NOTIFICATIONS: {
            LIST: '/notifications',
        }
    }
}

export const getNotificationUrl = (notificationId) => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST}/${notificationId}`
}

export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}

export const getFileUrl = (fileId) => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VAULT.FILES}/${fileId}`
}

export const getFileDownloadUrl = (fileId) => {
    return `${getFileUrl(fileId)}/download`
}

export const getFileContentUrl = (fileId) => {
    return `${getFileUrl(fileId)}/content`
}

export const getFileShareUrl = (fileId) => {
    return `${getFileUrl(fileId)}/share`
}

export const getFileAccessUrl = (fileId) => {
    return `${getFileUrl(fileId)}/access`
}

export const getRevokeShareUrl = (fileId, userId) => {
    return `${getFileUrl(fileId)}/share/${userId}`
}

export const getSessionsUrl = () => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SESSIONS}`
}

export const getSessionUrl = (sessionId) => {
    return `${getSessionsUrl()}/${sessionId}`
}

