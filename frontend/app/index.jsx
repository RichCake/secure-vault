import { StyleSheet, Text, View, Image } from 'react-native'
import { Link, router } from 'expo-router'
import { useEffect } from 'react'

import { Spinner } from '@/components/ui/spinner';

import Logo from "../assets/img/safe.png"
import ThemedView from '../components/ThemedView'
import ThemedCard from '../components/ThemedCard'
import ThemedLogo from '../components/ThemedLogo'
import Spacer from '../components/Spacer'
import ThemedText from '../components/ThemedText'
import { useUser } from '../hooks/useUser'

const Home = () => {
    const { user, loading } = useUser()

    // Redirect authenticated users to vault
    useEffect(() => {
        if (!loading && user) {
            router.replace('/(vault)/files')
        }
    }, [user, loading])

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <Spinner size="large" color="grey" />
                <Spacer height={20} />
                <ThemedText>Проверка авторизации...</ThemedText>
            </ThemedView>
        )
    }

    // Show login/register options for unauthenticated users
    return (
        <ThemedView style={styles.container}>
            <ThemedLogo source={Logo} />
            <Spacer height={10} />
            <ThemedText title={true} style={styles.title}>Хранилище документов</ThemedText>
            <Spacer height={10} />
            <ThemedText style={{ textAlign: "center" }}>Надежное хранилище со сквозным шифрованием файлов</ThemedText>
            <Spacer />
            <Link href="/(auth)/login" style={styles.link}><ThemedText>Вход</ThemedText></Link>
            <Spacer height={10} />
            <Link href="/(auth)/register" style={styles.link}><ThemedText>Создать аккаунт</ThemedText></Link>
            <Spacer height={10} />
            <Link href="/test-connection" style={styles.link}><ThemedText>Тест подключения</ThemedText></Link>
        </ThemedView>
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    link: {
        borderBottomWidth: 1
    },
    title: {
        fontWeight: 'bold',
        fontSize: 18,
    },
})