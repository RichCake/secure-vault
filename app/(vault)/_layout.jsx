import { View, Text, useColorScheme } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/Colors'

const VaultLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <Tabs
            screenOptions={{
                headerShown: false, tabBarStyle: {
                    backgroundColor: theme.navBackground,
                    paddingTop: 10,
                    height: 90,
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
                title: "Общий доступ ", tabBarIcon: ({ focused }) => (
                    <Ionicons size={24} name={focused ? "person-add" : "person-add-outline"} color={focused ? theme.iconColorFocused : theme.iconColor}></Ionicons>
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