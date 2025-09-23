import { StyleSheet, Text, View, Image } from 'react-native'
import { Link } from 'expo-router'

import Logo from "../assets/img/safe.png"
import ThemedView from '../components/ThemedView'
import ThemedCard from '../components/ThemedCard'
import ThemedLogo from '../components/ThemedLogo'
import Spacer from '../components/Spacer'
import ThemedText from '../components/ThemedText'

const Home = () => {
    return (
        <ThemedView style={styles.container}>
            <ThemedLogo source={Logo} />
            <Spacer height={10} />
            <ThemedText title={true} style={styles.title}>Хранилище документов</ThemedText>
            <Spacer height={10} />
            <ThemedText style={{ textAlign: "center" }}>Надежное хранилище со сквозным шифрованием файлов</ThemedText>
            <Spacer />
            <Link href="/login" style={styles.link}><ThemedText>Вход</ThemedText></Link>
            <Spacer height={10} />
            <Link href="/register" style={styles.link}><ThemedText>Создать аккаунт</ThemedText></Link>
            <Link href="/profile" style={styles.link}><ThemedText>Профиль</ThemedText></Link>
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