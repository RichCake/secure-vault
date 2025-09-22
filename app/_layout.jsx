import { StyleSheet, Text, useColorScheme, View } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'
import { Colors } from "../constants/Colors"
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

const RootLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <GluestackUIProvider>
            <SafeAreaProvider>
                <StatusBar value="auto" />
                <Stack screenOptions={{
                    headerStyle: { backgroundColor: theme.navBackground },
                    headerTintColor: theme.title,
                }}>
                    <Stack.Screen name='(auth)' options={{ headerShown: false }} />
                    <Stack.Screen name='(settings)' options={{ headerShown: false, title: "Настройки" }} />
                    <Stack.Screen name='(vault)' options={{ headerShown: false, title: "Хранилище" }} />

                    <Stack.Screen name='index' options={{ title: "Главная" }} />
                </Stack>
            </SafeAreaProvider>
        </GluestackUIProvider>
    )
}

export default RootLayout

const styles = StyleSheet.create({})