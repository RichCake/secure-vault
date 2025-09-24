import { Keyboard, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { useState } from 'react'

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
import { Center } from '@/components/ui/center';
import { Box } from '@/components/ui/box';
import { useUser } from '../../hooks/useUser';

const Login = () => {
    const [isInvalid, setIsInvalid] = useState(false);
    const [login, setLogin] = useState()
    const [password, setPassword] = useState()

    const { user } = useUser()

    const handleSubmit = () => {
        if (!login || !password) {
            setIsInvalid(true)
        } else {
            setIsInvalid(false)
        }
        console.log("current user", user)
        console.log("login form submitted", login, password)
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView className="flex-1 justify-center items-center">
                <VStack className="mx-5 w-full max-w-sm">
                    <Heading className="text-center mb-5" size={"2xl"}>Вход в хранилище</Heading>
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
                                placeholder="login"
                                value={login}
                                onChangeText={(text) => setLogin(text)}
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
                    >
                        <ButtonText>Войти</ButtonText>
                    </Button>
                </VStack>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

export default Login