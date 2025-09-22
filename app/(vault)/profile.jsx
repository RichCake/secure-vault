import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    Avatar,
    AvatarFallbackText,
    AvatarImage,
    AvatarBadge,
} from '@/components/ui/avatar';
import { Center } from '@/components/ui/center';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Link } from 'expo-router';

export default function Profile() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="px-4 flex-1">
                <Center className="py-8">
                    <Avatar size="2xl">
                        <AvatarFallbackText>Jane Doe</AvatarFallbackText>
                        <AvatarImage
                            source={{
                                uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
                            }}
                        />
                        <AvatarBadge />
                    </Avatar>
                    <Heading className="mt-4 text-center">Jane Doe</Heading>
                    <Text className="text-gray-500 text-center">jane.doe@email.com</Text>
                </Center>

                <VStack className="flex-1 justify-center space-y-4">
                    <Link href={"/account"} className="w-full">
                        <HStack className="items-center justify-between py-4 px-4 bg-gray-50 rounded-lg w-full">
                            <HStack className="items-center">
                                <Ionicons name="person-outline" size={24} color="black" />
                                <VStack className="ml-3">
                                    <Text className="text-base font-medium">Аккаунт и пароль</Text>
                                </VStack>
                            </HStack>
                            <Ionicons name="chevron-forward" size={20} color="gray" />
                        </HStack>
                    </Link>

                    <Link href={"/security"} className="w-full">
                        <HStack className="items-center justify-between py-4 px-4 bg-gray-50 rounded-lg w-full">
                            <HStack className="items-center">
                                <Ionicons name="shield-outline" size={24} color="black" />
                                <VStack className="ml-3">
                                    <Text className="text-base font-medium">Безопасность и конфиденциальность</Text>
                                </VStack>
                            </HStack>
                            <Ionicons name="chevron-forward" size={20} color="gray" />
                        </HStack>
                    </Link>
                </VStack>

                <View className="py-6">
                    <Button variant="outline" action="negative" className="w-full">
                        <ButtonText>Выйти из аккаунта</ButtonText>
                    </Button>
                </View>
            </VStack>
        </SafeAreaView>
    );
}
