import { useState } from 'react'
import { Modal, View, KeyboardAvoidingView, Platform } from 'react-native'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Input, InputField } from '@/components/ui/input'
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button'

const CreateFolderModal = ({
    visible,
    onClose,
    onSubmit,
    isLoading = false,
}) => {
    const [folderName, setFolderName] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = () => {
        const name = folderName.trim()
        if (!name) {
            setError('Введите название папки')
            return
        }
        if (name.length > 255) {
            setError('Название слишком длинное')
            return
        }
        setError('')
        onSubmit?.(name)
    }

    const handleClose = () => {
        setFolderName('')
        setError('')
        onClose?.()
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center items-center bg-black/50"
            >
                <View className="bg-white rounded-2xl p-6 mx-6 w-full max-w-sm">
                    <VStack className="space-y-4">
                        <Heading size="lg">Новая папка</Heading>

                        <VStack className="space-y-2">
                            <Text className="text-sm text-gray-600">
                                Название папки
                            </Text>
                            <Input size="lg">
                                <InputField
                                    placeholder="Введите название"
                                    value={folderName}
                                    onChangeText={setFolderName}
                                    autoFocus
                                    autoCapitalize="none"
                                />
                            </Input>
                            {error && (
                                <Text className="text-sm text-red-500">
                                    {error}
                                </Text>
                            )}
                        </VStack>

                        <HStack className="justify-end space-x-3 mt-4">
                            <Button
                                variant="outline"
                                onPress={handleClose}
                                isDisabled={isLoading}
                            >
                                <ButtonText>Отмена</ButtonText>
                            </Button>
                            <Button
                                onPress={handleSubmit}
                                isDisabled={isLoading || !folderName.trim()}
                            >
                                {isLoading ? (
                                    <ButtonSpinner color="white" />
                                ) : (
                                    <ButtonText>Создать</ButtonText>
                                )}
                            </Button>
                        </HStack>
                    </VStack>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

export default CreateFolderModal

