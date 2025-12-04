import { useState } from 'react'
import { View, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { HStack } from '@/components/ui/hstack'

const SearchBar = ({
    placeholder = 'Поиск...',
    value = '',
    onChangeText,
    onSearch,
    onClear,
}) => {
    const [isFocused, setIsFocused] = useState(false)

    const handleSubmit = () => {
        if (value.trim() && onSearch) {
            onSearch(value.trim())
        }
    }

    const handleClear = () => {
        onChangeText?.('')
        onClear?.()
    }

    return (
        <HStack
            className={`items-center px-3 py-2 rounded-xl ${
                isFocused ? 'bg-gray-100 border border-blue-500' : 'bg-gray-100'
            }`}
        >
            <Ionicons
                name="search-outline"
                size={20}
                color={isFocused ? '#3B82F6' : '#9CA3AF'}
            />
            <TextInput
                className="flex-1 ml-2 text-base text-gray-900"
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleSubmit}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={handleClear} className="p-1">
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            )}
        </HStack>
    )
}

export default SearchBar

