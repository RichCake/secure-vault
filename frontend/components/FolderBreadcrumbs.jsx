import { ScrollView, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/text'
import { HStack } from '@/components/ui/hstack'

const FolderBreadcrumbs = ({ folderStack = [], onNavigate }) => {
    // folderStack is an array of { id, name } objects
    // First item is always root (null id)

    const items = [{ id: null, name: 'Мои файлы' }, ...folderStack]

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-grow-0"
        >
            <HStack className="items-center py-2">
                {items.map((item, index) => (
                    <HStack key={item.id || 'root'} className="items-center">
                        {index > 0 && (
                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#9CA3AF"
                                style={{ marginHorizontal: 4 }}
                            />
                        )}
                        <TouchableOpacity
                            onPress={() => onNavigate?.(item, index)}
                            disabled={index === items.length - 1}
                        >
                            <Text
                                className={`text-sm ${
                                    index === items.length - 1
                                        ? 'font-semibold text-gray-900'
                                        : 'text-blue-600'
                                }`}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    </HStack>
                ))}
            </HStack>
        </ScrollView>
    )
}

export default FolderBreadcrumbs

