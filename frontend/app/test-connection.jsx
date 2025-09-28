import { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ButtonText } from '@/components/ui/button'
import { VStack } from '@/components/ui/vstack'
import { Heading } from '@/components/ui/heading'
import { getApiUrl, API_CONFIG } from '../config/api'

const TestConnection = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState('')

    const testConnection = async () => {
        setIsLoading(true)
        setResult('')
        
        try {
            console.log('Testing connection to:', getApiUrl(API_CONFIG.ENDPOINTS.USER.ME))
            
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.USER.ME), {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            
            const responseText = await response.text()
            console.log('Response status:', response.status)
            console.log('Response text:', responseText)
            
            setResult(`Status: ${response.status}\nResponse: ${responseText}`)
            
            if (response.ok) {
                Alert.alert('Успех!', 'Подключение к серверу работает!')
            } else {
                Alert.alert('Ошибка', `Сервер ответил с кодом: ${response.status}`)
            }
        } catch (error) {
            console.error('Connection test failed:', error)
            setResult(`Ошибка: ${error.message}`)
            Alert.alert('Ошибка подключения', error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const testRegister = async () => {
        setIsLoading(true)
        setResult('')
        
        try {
            const testUser = `testuser_${Date.now()}`
            console.log('Testing register with user:', testUser)
            
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REGISTER), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: testUser,
                    password: 'testpass123'
                }),
            })
            
            const responseText = await response.text()
            console.log('Register response status:', response.status)
            console.log('Register response text:', responseText)
            
            setResult(`Register Status: ${response.status}\nResponse: ${responseText}`)
            
            if (response.ok) {
                Alert.alert('Успех!', 'Регистрация работает!')
            } else {
                Alert.alert('Ошибка', `Регистрация не удалась: ${response.status}`)
            }
        } catch (error) {
            console.error('Register test failed:', error)
            setResult(`Ошибка регистрации: ${error.message}`)
            Alert.alert('Ошибка регистрации', error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            <VStack className="flex-1">
                <Heading className="mb-6">Тест подключения к серверу</Heading>
                
                <Text className="mb-4 text-gray-600">
                    Сервер: {API_CONFIG.BASE_URL}
                </Text>
                
                <VStack className="space-y-4 mb-6">
                    <Button onPress={testConnection} isDisabled={isLoading}>
                        <ButtonText>
                            {isLoading ? 'Тестируем...' : 'Тест /me endpoint'}
                        </ButtonText>
                    </Button>
                    
                    <Button onPress={testRegister} isDisabled={isLoading} variant="outline">
                        <ButtonText>
                            {isLoading ? 'Тестируем...' : 'Тест регистрации'}
                        </ButtonText>
                    </Button>
                </VStack>
                
                {result ? (
                    <View className="bg-gray-100 p-4 rounded-lg">
                        <Text className="font-mono text-sm">{result}</Text>
                    </View>
                ) : null}
            </VStack>
        </SafeAreaView>
    )
}

export default TestConnection
