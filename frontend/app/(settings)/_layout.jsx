import { Stack } from "expo-router"
import { StatusBar, useColorScheme } from "react-native"
import { Colors } from "../../constants/Colors"

export default function SettingsLayout() {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerShown: true,
                    animation: "none",
                    headerStyle: { backgroundColor: theme.navBackground },
                    headerTintColor: theme.title,
                }}

            >
                <Stack.Screen name="account" options={{ title: "Аккаунт и пароль" }} />
                <Stack.Screen name="security" options={{ title: "Безопасность и конфиденциальность" }} />
            </Stack>
        </>
    )
}