import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Button, ButtonText } from '@/components/ui/button'
import { Input, InputField } from '@/components/ui/input'
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control'

const Account = () => {
    const [userName, setUserName] = useState('Jane Doe')
    const [userEmail, setUserEmail] = useState('jane.doe@email.com')
    const [isEditingName, setIsEditingName] = useState(false)
    const [isEditingPassword, setIsEditingPassword] = useState(false)
    const [newName, setNewName] = useState(userName)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSaveName = () => {
        if (newName.trim()) {
            setUserName(newName.trim())
            setIsEditingName(false)
            Alert.alert('Успешно', 'Имя пользователя обновлено')
        } else {
            Alert.alert('Ошибка', 'Имя не может быть пустым')
        }
    }

    const handleCancelName = () => {
        setNewName(userName)
        setIsEditingName(false)
    }

    const handleSavePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Ошибка', 'Все поля должны быть заполнены')
            return
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Ошибка', 'Новые пароли не совпадают')
            return
        }

        if (newPassword.length < 6) {
            Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов')
            return
        }

        // Здесь должна быть логика проверки текущего пароля и смены пароля
        Alert.alert('Успешно', 'Пароль изменен')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setIsEditingPassword(false)
    }

    const handleCancelPassword = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setIsEditingPassword(false)
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="px-4 flex-1">
                <Heading className="py-4">Аккаунт</Heading>

                <VStack className="flex-1 space-y-6">
                    {/* Информация о пользователе */}
                    <VStack className="space-y-4">
                        <Text className="text-lg font-semibold">Информация о пользователе</Text>

                        {/* Имя пользователя */}
                        <VStack className="space-y-2">
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>Имя пользователя</FormControlLabelText>
                                </FormControlLabel>
                                {isEditingName ? (
                                    <HStack className="items-center space-x-2">
                                        <Input className="flex-1">
                                            <InputField
                                                value={newName}
                                                onChangeText={setNewName}
                                                placeholder="Введите новое имя"
                                            />
                                        </Input>
                                        <TouchableOpacity onPress={handleSaveName}>
                                            <Ionicons name="checkmark" size={24} color="green" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleCancelName}>
                                            <Ionicons name="close" size={24} color="red" />
                                        </TouchableOpacity>
                                    </HStack>
                                ) : (
                                    <HStack className="items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                        <Text className="text-base">{userName}</Text>
                                        <TouchableOpacity onPress={() => setIsEditingName(true)}>
                                            <Ionicons name="pencil" size={20} color="blue" />
                                        </TouchableOpacity>
                                    </HStack>
                                )}
                            </FormControl>
                        </VStack>

                        {/* Email */}
                        <VStack className="space-y-2">
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>Email</FormControlLabelText>
                                </FormControlLabel>
                                <HStack className="items-center justify-between py-3 px-4 bg-gray-100 rounded-lg">
                                    <Text className="text-base text-gray-600">{userEmail}</Text>
                                    <Text className="text-xs text-gray-500">Нельзя изменить</Text>
                                </HStack>
                            </FormControl>
                        </VStack>
                    </VStack>

                    {/* Безопасность */}
                    <VStack className="space-y-4">
                        <Text className="text-lg font-semibold">Безопасность</Text>

                        {/* Смена пароля */}
                        <VStack className="space-y-2">
                            <FormControl>
                                <FormControlLabel>
                                    <FormControlLabelText>Пароль</FormControlLabelText>
                                </FormControlLabel>
                                {isEditingPassword ? (
                                    <VStack className="space-y-3">
                                        <Input>
                                            <InputField
                                                value={currentPassword}
                                                onChangeText={setCurrentPassword}
                                                placeholder="Текущий пароль"
                                                secureTextEntry
                                            />
                                        </Input>
                                        <Input>
                                            <InputField
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                placeholder="Новый пароль"
                                                secureTextEntry
                                            />
                                        </Input>
                                        <Input>
                                            <InputField
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                placeholder="Подтвердите новый пароль"
                                                secureTextEntry
                                            />
                                        </Input>
                                        <HStack className="space-x-2">
                                            <Button className="flex-1" onPress={handleSavePassword}>
                                                <ButtonText>Сохранить</ButtonText>
                                            </Button>
                                            <Button variant="outline" className="flex-1" onPress={handleCancelPassword}>
                                                <ButtonText>Отмена</ButtonText>
                                            </Button>
                                        </HStack>
                                    </VStack>
                                ) : (
                                    <HStack className="items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                                        <Text className="text-base">12345</Text>
                                        <TouchableOpacity onPress={() => setIsEditingPassword(true)}>
                                            <Ionicons name="pencil" size={20} color="blue" />
                                        </TouchableOpacity>
                                    </HStack>
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