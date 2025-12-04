import { useState, useEffect } from 'react'
import { Modal, View, KeyboardAvoidingView, Platform } from 'react-native'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { HStack } from '@/components/ui/hstack'
import { Heading } from '@/components/ui/heading'
import { Input, InputField } from '@/components/ui/input'
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button'

const RenameModal = ({
    visible,
    item,
    onClose,
    onSubmit,
    isLoading = false,
}) => {
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (item) {
            setName(item.name)
            setError('')
        }
    }, [item])

    const handleSubmit = () => {
        const newName = name.trim()
        if (!newName) {
            setError('Введите название')
            return
        }
        if (newName.length > 255) {
            setError('Название слишком длинное')
            return
        }
        if (newName === item?.name) {
            handleClose()
            return
        }
        setError('')
        onSubmit?.(item, newName)
    }

    const handleClose = () => {
        setName('')
        setError('')
        onClose?.()
    }

    const isFolder = item?.is_folder

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
                        <Heading size="lg">
                            Переименовать {isFolder ? 'папку' : 'файл'}
                        </Heading>

                        <VStack className="space-y-2">
                            <Text className="text-sm text-gray-600">
                                Новое название
                            </Text>
                            <Input size="lg">
                                <InputField
                                    placeholder="Введите название"
                                    value={name}
                                    onChangeText={setName}
                                    autoFocus
                                    selectTextOnFocus
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
                                isDisabled={isLoading || !name.trim()}
                            >
                                {isLoading ? (
                                    <ButtonSpinner color="white" />
                                ) : (
                                    <ButtonText>Сохранить</ButtonText>
                                )}
                            </Button>
                        </HStack>
                    </VStack>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

export default RenameModal

