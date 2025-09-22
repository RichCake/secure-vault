import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { SafeAreaView } from 'react-native-safe-area-context'
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import {
    Menu,
    MenuItem,
    MenuItemLabel,
    MenuSeparator,
} from '@/components/ui/menu';
import { Button, ButtonText } from '@/components/ui/button';

const TEST_DATA = {
    id: 'root',
    name: 'Мое хранилище',
    type: 'folder',
    children: [
        {
            id: 'docs',
            name: 'Документы',
            type: 'folder',
            children: [
                { id: 'doc-1', name: 'Резюме.pdf', type: 'file', size: '120 КБ' },
                { id: 'doc-2', name: 'Отчет.xlsx', type: 'file', size: '88 КБ' }
            ]
        },
        {
            id: 'photos',
            name: 'Фотографии',
            type: 'folder',
            children: [
                { id: 'img-1', name: 'Отпуск.jpg', type: 'file', size: '1.2 МБ' },
                { id: 'img-2', name: 'Семья.png', type: 'file', size: '860 КБ' }
            ]
        },
        { id: 'readme', name: 'README.txt', type: 'file', size: '2 КБ' }
    ]
}

const Item = ({ name, type, size }) => (
    <TouchableOpacity>
        <HStack className="items-center justify-between py-4">
            <HStack className="items-center flex-1">
                <Ionicons
                    name={type === 'folder' ? 'folder-outline' : 'document-outline'}
                    size={24}
                    color="black"
                />
                <VStack className="ml-3 flex-1">
                    <Text className="text-base font-medium">{name}</Text>
                    {size && (
                        <Text className="text-sm text-gray-500">{size}</Text>
                    )}
                </VStack>
            </HStack>
            <View className="me-2">
                <Menu
                    trigger={({ ...triggerProps }) => {
                        return (
                            <TouchableOpacity {...triggerProps}>
                                <Ionicons name="ellipsis-horizontal-sharp" size={24} color="black" />
                            </TouchableOpacity>
                        );
                    }}
                >
                    <MenuItem>
                        <Ionicons name="ellipsis-horizontal-sharp" size={24} color="black" />
                    </MenuItem>
                </Menu>
            </View>
        </HStack>
        <View className="h-px bg-gray-200" />
    </TouchableOpacity>
)

const Files = () => {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="px-4">
                <Heading className="py-4">{TEST_DATA.name}</Heading>
                <FlatList
                    data={TEST_DATA.children}
                    renderItem={({ item }) => (
                        <Item
                            name={item.name}
                            type={item.type}
                            size={item.size}
                        />
                    )}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </VStack>
        </SafeAreaView>
    )
}

export default Files

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "stretch",
    },
    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    },
})