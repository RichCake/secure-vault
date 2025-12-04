import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { Center } from '@/components/ui/center'

const EmptyState = ({
    icon = 'folder-open-outline',
    title = 'Пусто',
    description = 'Здесь пока ничего нет',
    iconColor = '#9CA3AF',
}) => {
    return (
        <Center className="flex-1 py-16">
            <VStack className="items-center">
                <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                    <Ionicons name={icon} size={40} color={iconColor} />
                </View>
                <Text className="text-lg font-medium text-gray-700 mb-1">
                    {title}
                </Text>
                <Text className="text-sm text-gray-500 text-center px-8">
                    {description}
                </Text>
            </VStack>
        </Center>
    )
}

export default EmptyState

