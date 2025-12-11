import { useColorScheme } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/Colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const VaultLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const insets = useSafeAreaInsets()

    return (
        <Tabs
            screenOptions={{
                headerShown: false, tabBarStyle: {
                    backgroundColor: theme.navBackground,
                    paddingTop: 5,
                    paddingBottom: insets.bottom,
                    height: 60 + insets.bottom,
                },
                tabBarActiveTintColor: theme.iconColorFocused,
                tabBarInactiveTintColor: theme.iconColor,
            }}
        >
            <Tabs.Screen name='files' options={{
                title: "Файлы", tabBarIcon: ({ focused }) => (
                    <Ionicons size={24} name={focused ? "folder" : "folder-outline"} color={focused ? theme.iconColorFocused : theme.iconColor}></Ionicons>
                )
            }} />
            <Tabs.Screen name='shares' options={{
                title: "Общий доступ", tabBarIcon: ({ focused }) => (
                    <Ionicons size={24} name={focused ? "person-add" : "person-add-outline"} color={focused ? theme.iconColorFocused : theme.iconColor}></Ionicons>
                )
            }} />
            <Tabs.Screen name='notifications' options={{
                title: "Уведомления", tabBarIcon: ({ focused }) => (
                    <Ionicons size={24} name={focused ? "notifications" : "notifications-outline"} color={focused ? theme.iconColorFocused : theme.iconColor}></Ionicons>
                )
            }} />
            <Tabs.Screen name='profile' options={{
                title: "Профиль", tabBarIcon: ({ focused }) => (
                    <Ionicons size={24} name={focused ? "person-circle" : "person-circle-outline"} color={focused ? theme.iconColorFocused : theme.iconColor}></Ionicons>
                )
            }} />
        </Tabs>
    )
}

export default VaultLayout