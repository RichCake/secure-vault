import { Keyboard, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { router, Link } from 'expo-router'

import {
    FormControl,
    FormControlLabel,
    FormControlError,
    FormControlErrorText,
    FormControlErrorIcon,
    FormControlHelper,
    FormControlHelperText,
    FormControlLabelText,
} from '@/components/ui/form-control';
import { AlertCircleIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui/heading';
import { useUser } from '../../hooks/useUser';

const Register = () => {
    const [isInvalid, setIsInvalid] = React.useState(false);
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { user, register, error, clearError } = useUser()

    // Redirect if user is already logged in
    useEffect(() => {
        if (user) {
            router.replace('/(vault)/files')
        }
    }, [user])

    // Clear error when component mounts
    useEffect(() => {
        clearError()
    }, [])

    const handleSubmit = async () => {
        if (!username || !password) {
            setIsInvalid(true)
            return
        }

        setIsInvalid(false)
        setIsSubmitting(true)

        try {
            const result = await register(username, password)
            
            if (result.success) {
                // Navigation will be handled by the useEffect above
                console.log('Registration successful:', result.user)
            } else {
                Alert.alert('Ошибка регистрации', result.error || 'Не удалось создать аккаунт')
            }
        } catch (err) {
            Alert.alert('Ошибка', 'Произошла неожиданная ошибка')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView className="flex-1 justify-center items-center">
                <VStack className="mx-5 w-full max-w-sm">
                    <Heading className="text-center mb-5" size={"2xl"}>Создание аккаунта</Heading>
                    <FormControl
                        isInvalid={isInvalid}
                        size="md"
                        isDisabled={false}
                        isReadOnly={false}
                        isRequired={false}
                    >
                        <FormControlLabel>
                            <FormControlLabelText>Логин</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="my-1" size="xl">
                            <InputField
                                placeholder="username"
                                value={username}
                                onChangeText={(text) => setUsername(text)}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </Input>
                        <FormControlHelper>
                            <FormControlHelperText>
                                Ваш логин.
                            </FormControlHelperText>
                        </FormControlHelper>
                        <FormControlError>
                            <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                            <FormControlErrorText className="text-red-500">
                                Введите логин.
                            </FormControlErrorText>
                        </FormControlError>
                    </FormControl>
                    <FormControl
                        isInvalid={isInvalid}
                        size="md"
                        isDisabled={false}
                        isReadOnly={false}
                        isRequired={false}
                    >
                        <FormControlLabel>
                            <FormControlLabelText>Пароль</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="my-1" size="xl">
                            <InputField
                                type="password"
                                placeholder="password"
                                value={password}
                                onChangeText={(text) => setPassword(text)}
                            />
                        </Input>
                        <FormControlHelper>
                            <FormControlHelperText>
                                Ваш пароль.
                            </FormControlHelperText>
                        </FormControlHelper>
                        <FormControlError>
                            <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                            <FormControlErrorText className="text-red-500">
                                Введите пароль.
                            </FormControlErrorText>
                        </FormControlError>
                    </FormControl>
                    <Button
                        className="w-fit self-end mt-4"
                        size="md"
                        variant="outline"
                        onPress={handleSubmit}
                        isDisabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ButtonSpinner />
                        ) : (
                            <ButtonText>Создать</ButtonText>
                        )}
                    </Button>
                </VStack>
                <Link href="/(auth)/login" style={styles.link}>Уже есть аккаунт? Войти</Link>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

const styles = StyleSheet.create({
    link: {
        borderBottomWidth: 1,
        marginTop: 20,
    },
})

export default Register