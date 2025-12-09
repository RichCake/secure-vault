import { View, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button'
import { Input, InputField } from '@/components/ui/input'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'
import { Spinner } from '@/components/ui/spinner'

import { useUser } from '../../hooks/useUser'
import { changePassword, ApiError } from '../../services/vaultService'

const Account = () => {
    const { user, loading: authLoading } = useUser()

    const [isEditingPassword, setIsEditingPassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/(auth)/login')
        }
    }, [user, authLoading])

    const handleSavePassword = async () => {
        setError('')

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Все поля должны быть заполнены')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Новые пароли не совпадают')
            return
        }

        if (newPassword.length < 6) {
            setError('Пароль должен содержать минимум 6 символов')
            return
        }

        setIsSubmitting(true)
        try {
            await changePassword(currentPassword, newPassword)
            Alert.alert('Успешно', 'Пароль изменен')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setIsEditingPassword(false)
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
            } else {
                setError('Не удалось изменить пароль')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelPassword = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setError('')
        setIsEditingPassword(false)
    }

    if (authLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <Spinner size="large" color="grey" />
            </SafeAreaView>
        )
    }

    if (!user) {
        return null
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="px-4 flex-1">
                <HStack className="items-center py-4">
                    {/* <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity> */}
                    <Heading>Аккаунт</Heading>
                </HStack>

                <VStack className="flex-1 space-y-6">
                    {/* Информация о пользователе */}
                    <VStack className="space-y-4">
                        <Text className="text-lg font-semibold text-gray-700">
                            Информация о пользователе
                        </Text>

                        {/* Username */}
                        <VStack className="space-y-2">
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>Имя пользователя</FormControlLabelText>
                                </FormControlLabel>
                                <HStack className="items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                    <Text className="text-base">{user.username}</Text>
                                    <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
                                </HStack>
                                <Text className="text-xs text-gray-400 mt-1">
                                    Имя пользователя нельзя изменить
                                </Text>
                            </FormControl>
                        </VStack>
                    </VStack>

                    {/* Безопасность */}
                    <VStack className="space-y-4">
                        <Text className="text-lg font-semibold text-gray-700">
                            Безопасность
                        </Text>

                        {/* Смена пароля */}
                        <VStack className="space-y-2">
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>Пароль</FormControlLabelText>
                                </FormControlLabel>
                                {isEditingPassword ? (
                                    <VStack className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                        <Input>
                                            <InputField
                                                value={currentPassword}
                                                onChangeText={setCurrentPassword}
                                                placeholder="Текущий пароль"
                                                secureTextEntry
                                                autoCapitalize="none"
                                            />
                                        </Input>
                                        <Input>
                                            <InputField
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                placeholder="Новый пароль (мин. 6 символов)"
                                                secureTextEntry
                                                autoCapitalize="none"
                                            />
                                        </Input>
                                        <Input>
                                            <InputField
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                placeholder="Подтвердите новый пароль"
                                                secureTextEntry
                                                autoCapitalize="none"
                                            />
                                        </Input>

                                        {error && (
                                            <Text className="text-sm text-red-500">
                                                {error}
                                            </Text>
                                        )}

                                        <HStack className="space-x-2 pt-2">
                                            <Button
                                                className="flex-1"
                                                onPress={handleSavePassword}
                                                isDisabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <ButtonSpinner color="white" />
                                                ) : (
                                                    <ButtonText>Сохранить</ButtonText>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onPress={handleCancelPassword}
                                                isDisabled={isSubmitting}
                                            >
                                                <ButtonText>Отмена</ButtonText>
                                            </Button>
                                        </HStack>
                                    </VStack>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => setIsEditingPassword(true)}
                                        className="py-3 px-4 bg-gray-50 rounded-lg"
                                    >
                                        <HStack className="items-center justify-between">
                                            <HStack className="items-center">
                                                <Ionicons name="key-outline" size={20} color="#666" />
                                                <Text className="text-base ml-2">Изменить пароль</Text>
                                            </HStack>
                                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                        </HStack>
                                    </TouchableOpacity>
                                )}
                            </FormControl>
                        </VStack>
                    </VStack>
                </VStack>
            </VStack>
        </SafeAreaView>
    )
}

export default Account
