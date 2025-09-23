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

const SHARED_USERS = [
    {
        id: 'user-1',
        name: 'Анна Петрова',
        email: 'anna.petrova@email.com',
        role: 'Редактор',
        lastActive: '2 часа назад',
        avatar: null
    },
    {
        id: 'user-2',
        name: 'Михаил Иванов',
        email: 'mikhail.ivanov@email.com',
        role: 'Читатель',
        lastActive: '1 день назад',
        avatar: null
    },
    {
        id: 'user-3',
        name: 'Елена Сидорова',
        email: 'elena.sidorova@email.com',
        role: 'Администратор',
        lastActive: '30 минут назад',
        avatar: null
    },
    {
        id: 'user-4',
        name: 'Дмитрий Козлов',
        email: 'dmitry.kozlov@email.com',
        role: 'Редактор',
        lastActive: '3 дня назад',
        avatar: null
    },
    {
        id: 'user-5',
        name: 'Ольга Морозова',
        email: 'olga.morozova@email.com',
        role: 'Читатель',
        lastActive: '1 неделю назад',
        avatar: null
    }
]

const Item = ({ name, login, role }) => (
    <TouchableOpacity>
        <HStack className="items-center justify-between py-4">
            <HStack className="items-center flex-1">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                    <Ionicons
                        name="person-outline"
                        size={20}
                        color="black"
                    />
                </View>
                <VStack className="ml-3 flex-1">
                    <Text className="text-base font-medium">{name}</Text>
                    <Text className="text-sm text-gray-500">{login}</Text>
                    <HStack className="items-center mt-1">
                        <Text className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {role}
                        </Text>
                    </HStack>
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
                </Menu>
            </View>
        </HStack>
        <View className="h-px bg-gray-200" />
    </TouchableOpacity>
)

const Shares = () => {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="px-4">
                <Heading className="py-4">Общий доступ</Heading>
                <FlatList
                    data={SHARED_USERS}
                    renderItem={({ item }) => (
                        <Item
                            name={item.name}
                            login={item.email}
                            role={item.role}
                        />
                    )}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </VStack>
        </SafeAreaView>
    )
}

export default Shares