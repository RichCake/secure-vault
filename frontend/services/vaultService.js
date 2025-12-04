import {
    API_CONFIG,
    getApiUrl,
    getFileUrl,
    getFileDownloadUrl,
    getFileContentUrl,
    getFileShareUrl,
    getFileAccessUrl,
    getRevokeShareUrl,
    getSessionsUrl,
    getSessionUrl,
} from '../config/api'

export const ErrorType = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
    SERVER_ERROR: 'SERVER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
}

export class ApiError extends Error {
    constructor(type, message, status) {
        super(message)
        this.type = type
        this.status = status
        this.name = 'ApiError'
    }
}

let onUnauthorized = null

export const setOnUnauthorized = (callback) => {
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

    if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type']
    }

    try {
        const response = await fetch(url, { ...defaultOptions, ...options })

        if (!response.ok) {
            let errorMessage = 'Произошла ошибка'

            try {
                const errorData = await response.json()
                errorMessage = errorData.detail || errorMessage
            } catch { }

            switch (response.status) {
                case 401:
                    if (onUnauthorized) {
                        onUnauthorized()
                    }
                    throw new ApiError(ErrorType.UNAUTHORIZED, 'Сессия истекла. Войдите снова.', 401)
                case 403:
                    throw new ApiError(ErrorType.FORBIDDEN, 'Нет доступа к этому ресурсу', 403)
                case 404:
                    throw new ApiError(ErrorType.NOT_FOUND, 'Файл или папка не найдены', 404)
                case 400:
                    throw new ApiError(ErrorType.BAD_REQUEST, errorMessage, 400)
                default:
                    throw new ApiError(ErrorType.SERVER_ERROR, 'Ошибка сервера, попробуйте позже', response.status)
            }
        }

        if (response.status === 204) {
            return null
        }

        return await response.json()
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }
        throw new ApiError(ErrorType.NETWORK_ERROR, 'Проблемы с подключением к серверу', 0)
    }
}

export const getFiles = async (parentId = null, shared = null) => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.VAULT.FILES)
    const params = new URLSearchParams()

    if (parentId) {
        params.append('parent_id', parentId)
    }
    if (shared !== null) {
        params.append('shared', shared.toString())
    }

    if (params.toString()) {
        url += `?${params.toString()}`
    }

    return apiFetch(url)
}

export const getFile = async (fileId) => {
    return apiFetch(getFileUrl(fileId))
}

export const createFolder = async (name, parentId = null) => {
    return apiFetch(getApiUrl(API_CONFIG.ENDPOINTS.VAULT.FOLDERS), {
        method: 'POST',
        body: JSON.stringify({ name, parent_id: parentId }),
    })
}

export const uploadFile = async (fileUri, fileName, mimeType, parentId = null) => {
    const formData = new FormData()

    formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
    })

    if (parentId) {
        formData.append('parent_id', parentId)
    }

    return apiFetch(getApiUrl(API_CONFIG.ENDPOINTS.VAULT.UPLOAD), {
        method: 'POST',
        body: formData,
    })
}

export const reuploadFile = async (fileId, fileUri, fileName, mimeType) => {
    const formData = new FormData()

    formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: mimeType,
    })

    return apiFetch(getFileContentUrl(fileId), {
        method: 'PUT',
        body: formData,
    })
}

export const getDownloadUrl = async (fileId) => {
    const url = getFileDownloadUrl(fileId)

    // In React Native, we need to follow the redirect and get the final URL
    const response = await fetch(url, {
        credentials: 'include',
        method: 'GET',
    })

    // If we got redirected, response.url will be the final URL
    if (response.ok && response.url && response.url !== url) {
        return response.url
    }

    // Try to get Location header (may work on some platforms)
    const location = response.headers.get('Location')
    if (location) {
        return location
    }

    // If response is OK but no redirect, check response URL
    if (response.ok && response.url) {
        return response.url
    }

    if (!response.ok) {
        let errorMessage = 'Не удалось получить ссылку на скачивание'
        try {
            const errorData = await response.json()
            errorMessage = errorData.detail || errorMessage
        } catch { }

        if (response.status === 401) {
            if (onUnauthorized) onUnauthorized()
            throw new ApiError(ErrorType.UNAUTHORIZED, 'Сессия истекла', 401)
        }
        throw new ApiError(ErrorType.SERVER_ERROR, errorMessage, response.status)
    }

    return null
}

export const updateFile = async (fileId, data) => {
    return apiFetch(getFileUrl(fileId), {
        method: 'PATCH',
        body: JSON.stringify(data),
    })
}

export const deleteFile = async (fileId) => {
    return apiFetch(getFileUrl(fileId), {
        method: 'DELETE',
    })
}

export const searchFiles = async (query) => {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.VAULT.SEARCH)}?q=${encodeURIComponent(query)}`
    return apiFetch(url)
}

export const shareFile = async (fileId, targetUsername, permission = 'read') => {
    return apiFetch(getFileShareUrl(fileId), {
        method: 'POST',
        body: JSON.stringify({
            target_username: targetUsername,
            permission,
        }),
    })
}

export const getFileAccess = async (fileId) => {
    return apiFetch(getFileAccessUrl(fileId))
}

export const revokeAccess = async (fileId, userId) => {
    return apiFetch(getRevokeShareUrl(fileId, userId), {
        method: 'DELETE',
    })
}

export const searchUsers = async (query) => {
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.AUTH.USERS_SEARCH)}?q=${encodeURIComponent(query)}`
    return apiFetch(url)
}

export const changePassword = async (currentPassword, newPassword) => {
    return apiFetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'POST',
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
        }),
    })
}

// Sessions management
export const getSessions = async () => {
    return apiFetch(getSessionsUrl())
}

export const revokeSession = async (sessionId) => {
    return apiFetch(getSessionUrl(sessionId), {
        method: 'DELETE',
    })
}

export const revokeAllSessions = async () => {
    return apiFetch(getSessionsUrl(), {
        method: 'DELETE',
    })
}

export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Б'

    const units = ['Б', 'КБ', 'МБ', 'ГБ']
    let unitIndex = 0
    let size = bytes

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }

    return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}

export const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export const getFileIcon = (isFolder, mimeType) => {
    if (isFolder) return 'folder'

    if (!mimeType) return 'document-outline'

    if (mimeType.startsWith('image/')) return 'image-outline'
    if (mimeType.startsWith('video/')) return 'videocam-outline'
    if (mimeType.startsWith('audio/')) return 'musical-notes-outline'
    if (mimeType.includes('pdf')) return 'document-text-outline'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive-outline'
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'grid-outline'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'easel-outline'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document-text-outline'

    return 'document-outline'
}

