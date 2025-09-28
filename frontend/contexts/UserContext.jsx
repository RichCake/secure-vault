import { createContext, useState, useEffect } from "react"
import { API_CONFIG, getApiUrl } from "../config/api"

export const UserContext = createContext()

export function UserProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check if user is already logged in on app start
    useEffect(() => {
        // Add a small delay to ensure app is fully loaded
        const timer = setTimeout(() => {
            checkAuthStatus()
        }, 1000)
        
        return () => clearTimeout(timer)
    }, [])

    const checkAuthStatus = async () => {
        try {
            setLoading(true)
            const url = getApiUrl(API_CONFIG.ENDPOINTS.USER.ME)
            console.log('Checking auth status at:', url)
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include', // This ensures cookies are sent
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            console.log('Auth check response status:', response.status)
            
            if (response.ok) {
                const userData = await response.json()
                console.log('Auth check successful, user data:', userData)
                setUser(userData)
            } else {
                console.log('Auth check failed, status:', response.status)
                setUser(null)
            }
        } catch (err) {
            console.error('Auth check failed:', err)
            console.error('Error details:', err.message)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (username, password) => {
        try {
            setLoading(true)
            setError(null)

            const url = getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN)
            console.log('Attempting login at:', url)
            console.log('Login credentials:', { username })

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include', // This ensures cookies are sent and received
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            })

            console.log('Login response status:', response.status)

            if (response.ok) {
                const userData = await response.json()
                console.log('Login successful, user data:', userData)
                setUser(userData)
                return { success: true, user: userData }
            } else {
                const errorData = await response.json()
                console.log('Login failed, error data:', errorData)
                setError(errorData.detail || 'Login failed')
                return { success: false, error: errorData.detail || 'Login failed' }
            }
        } catch (err) {
            console.error('Login network error:', err)
            console.error('Error details:', err.message)
            const errorMessage = 'Network error. Please check your connection.'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const register = async (username, password) => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REGISTER), {
                method: 'POST',
                credentials: 'include', // This ensures cookies are sent and received
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            })

            if (response.ok) {
                const userData = await response.json()
                setUser(userData)
                return { success: true, user: userData }
            } else {
                const errorData = await response.json()
                setError(errorData.detail || 'Registration failed')
                return { success: false, error: errorData.detail || 'Registration failed' }
            }
        } catch (err) {
            const errorMessage = 'Network error. Please check your connection.'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
                method: 'POST',
                credentials: 'include', // This ensures cookies are sent
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                setUser(null)
                return { success: true }
            } else {
                const errorData = await response.json()
                setError(errorData.detail || 'Logout failed')
                return { success: false, error: errorData.detail || 'Logout failed' }
            }
        } catch (err) {
            const errorMessage = 'Network error. Please check your connection.'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const clearError = () => {
        setError(null)
    }

    return (
        <UserContext.Provider value={{
            user,
            loading,
            error,
            login,
            logout,
            register,
            clearError,
            checkAuthStatus,
        }}>
            {children}
        </UserContext.Provider>
    );
}

// Wrap the UserProvider component around the root layout stack