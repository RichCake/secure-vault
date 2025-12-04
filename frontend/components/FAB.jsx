import { useState } from 'react'
import { View, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/text'
import { HStack } from '@/components/ui/hstack'

const FAB = ({
    onUploadFile,
    onCreateFolder,
}) => {
    const [isOpen, setIsOpen] = useState(false)

    const toggleMenu = () => {
        setIsOpen(!isOpen)
    }

    const handleAction = (action) => {
        setIsOpen(false)
        action?.()
    }

    return (
        <>
            {/* Backdrop - full screen overlay */}
            {isOpen && (
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setIsOpen(false)}
                />
            )}

            <View className="absolute bottom-6 right-6">
                {/* Menu items - positioned above the FAB */}
                {isOpen && (
                    <View className="absolute bottom-16 right-0 mb-3 min-w-[200px]">
                        {/* Upload file */}
                        <TouchableOpacity
                            onPress={() => handleAction(onUploadFile)}
                            className="mb-3"
                            activeOpacity={0.7}
                        >
                            <HStack className="items-center justify-end bg-white rounded-xl shadow-lg px-4 py-3">
                                <Text className="mr-3 text-gray-700 font-medium">Загрузить файл</Text>
                                <View className="w-11 h-11 rounded-full bg-blue-500 items-center justify-center">
                                    <Ionicons name="cloud-upload-outline" size={24} color="white" />
                                </View>
                            </HStack>
                        </TouchableOpacity>

                        {/* Create folder */}
                        <TouchableOpacity
                            onPress={() => handleAction(onCreateFolder)}
                            activeOpacity={0.7}
                        >
                            <HStack className="items-center justify-end bg-white rounded-xl shadow-lg px-4 py-3">
                                <Text className="mr-3 text-gray-700 font-medium">Создать папку</Text>
                                <View className="w-11 h-11 rounded-full bg-amber-500 items-center justify-center">
                                    <Ionicons name="folder-outline" size={24} color="white" />
                                </View>
                            </HStack>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Main FAB button */}
                <TouchableOpacity
                    onPress={toggleMenu}
                    className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
                        isOpen ? 'bg-gray-600' : 'bg-blue-600'
                    }`}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isOpen ? 'close' : 'add'}
                        size={28}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
        </>
    )
}

export default FAB

