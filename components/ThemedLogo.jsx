import { Image, useColorScheme } from 'react-native'

import DarkLogo from "../assets/img/safe.png"
import LightLogo from "../assets/img/safe.png"

const ThemedLogo = () => {
    const colorScheme = useColorScheme()

    const logo = colorScheme === 'dark' ? DarkLogo : LightLogo

    return (
        <Image source={logo} />
    )
}

export default ThemedLogo