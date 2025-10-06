// API Configuration
export const API_CONFIG = {
    // Change this to your actual backend URL
    BASE_URL: 'http://10.201.245.194:8000',

    // API endpoints
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
        },
        USER: {
            ME: '/me',
        }
    }
}

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
    return `${API_CONFIG.BASE_URL}${endpoint}`
}
