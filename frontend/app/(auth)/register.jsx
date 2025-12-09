import { Keyboard, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View, Alert } from 'react-native'
import React, { useState, useEffect, useMemo } from 'react'
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
import { AlertCircleIcon, CheckCircleIcon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heading } from '@/components/ui/heading';
import { useUser } from '../../hooks/useUser';

const PASSWORD_REQUIREMENTS = [
    { id: 'length', label: 'Минимум 8 символов', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', label: 'Заглавная буква (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'Строчная буква (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'Цифра (0-9)', test: (pwd) => /[0-9]/.test(pwd) },
];

const PasswordRequirement = ({ met, label }) => (
    <HStack className="items-center gap-2 my-0.5">
        <View style={[styles.indicator, met ? styles.indicatorMet : styles.indicatorUnmet]} />
        <Text style={[styles.requirementText, met ? styles.requirementMet : styles.requirementUnmet]}>
            {label}
        </Text>
    </HStack>
);

const Register = () => {
    const [isInvalid, setIsInvalid] = React.useState(false);
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showRequirements, setShowRequirements] = useState(false)

    const { user, register, error, clearError } = useUser()

    const passwordValidation = useMemo(() => {
        const results = PASSWORD_REQUIREMENTS.map(req => ({
            ...req,
            met: req.test(password)
        }));
        const allMet = results.every(r => r.met);
        const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
        return { requirements: results, allMet, passwordsMatch };
    }, [password, confirmPassword]);

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
        let hasErrors = false;

        if (!username) {
            setIsInvalid(true)
            hasErrors = true;
        } else {
            setIsInvalid(false)
        }

        if (!passwordValidation.allMet) {
            setIsPasswordInvalid(true)
            hasErrors = true;
        } else {
            setIsPasswordInvalid(false)
        }

        if (!passwordValidation.passwordsMatch) {
            Alert.alert('Ошибка', 'Пароли не совпадают')
            return;
        }

        if (hasErrors) return;

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
                        <FormControlError>
                            <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                            <FormControlErrorText className="text-red-500">
                                Введите логин.
                            </FormControlErrorText>
                        </FormControlError>
                    </FormControl>
                    <FormControl
                        isInvalid={isPasswordInvalid}
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
                                onFocus={() => setShowRequirements(true)}
                            />
                        </Input>
                        
                        {/* Password Requirements */}
                        {(showRequirements || password.length > 0) && (
                            <View style={styles.requirementsContainer}>
                                <Text style={styles.requirementsTitle}>Требования к паролю:</Text>
                                {passwordValidation.requirements.map((req) => (
                                    <PasswordRequirement key={req.id} met={req.met} label={req.label} />
                                ))}
                            </View>
                        )}
                        
                        <FormControlError>
                            <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                            <FormControlErrorText className="text-red-500">
                                Пароль не соответствует требованиям.
                            </FormControlErrorText>
                        </FormControlError>
                    </FormControl>
                    
                    <FormControl
                        isInvalid={password.length > 0 && confirmPassword.length > 0 && !passwordValidation.passwordsMatch}
                        size="md"
                        isDisabled={false}
                        isReadOnly={false}
                        isRequired={false}
                    >
                        <FormControlLabel>
                            <FormControlLabelText>Подтвердите пароль</FormControlLabelText>
                        </FormControlLabel>
                        <Input className="my-1" size="xl">
                            <InputField
                                type="password"
                                placeholder="confirm password"
                                value={confirmPassword}
                                onChangeText={(text) => setConfirmPassword(text)}
                            />
                        </Input>
                        {confirmPassword.length > 0 && (
                            <FormControlHelper>
                                <FormControlHelperText style={passwordValidation.passwordsMatch ? styles.matchSuccess : styles.matchError}>
                                    {passwordValidation.passwordsMatch ? '✓ Пароли совпадают' : '✗ Пароли не совпадают'}
                                </FormControlHelperText>
                            </FormControlHelper>
                        )}
                        <FormControlError>
                            <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
                            <FormControlErrorText className="text-red-500">
                                Пароли не совпадают.
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
    requirementsContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        color: '#555',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    indicatorMet: {
        backgroundColor: '#22c55e',
    },
    indicatorUnmet: {
        backgroundColor: '#d1d5db',
    },
    requirementText: {
        fontSize: 13,
    },
    requirementMet: {
        color: '#22c55e',
    },
    requirementUnmet: {
        color: '#6b7280',
    },
    matchSuccess: {
        color: '#22c55e',
    },
    matchError: {
        color: '#ef4444',
    },
})

export default Register