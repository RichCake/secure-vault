import { TouchableOpacity, View, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/text'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import {
    Menu,
    MenuItem,
    MenuItemLabel,
    MenuSeparator,
} from '@/components/ui/menu'
import { formatFileSize, formatDate, getFileIcon } from '../services/vaultService'

const FileItem = ({
    item,
    onPress,
    onDownload,
    onReupload,
    onRename,
    onMove,
    onDelete,
    onShare,
    showOwner = false,
    ownerName = null,
}) => {
    const isFolder = item.is_folder
    const iconName = isFolder ? 'folder' : getFileIcon(false, item.mime_type)
    const iconColor = isFolder ? '#FFC107' : '#666'

    const handleDelete = () => {
        Alert.alert(
            'Удаление',
            `Вы уверены, что хотите удалить "${item.name}"?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: () => onDelete?.(item),
                },
            ]
        )
    }

    return (
        <TouchableOpacity onPress={() => onPress?.(item)} activeOpacity={0.7}>
            <HStack className="items-center justify-between py-3">
                <HStack className="items-center flex-1">
                    <View className="w-10 h-10 items-center justify-center">
                        <Ionicons name={iconName} size={28} color={iconColor} />
                    </View>
                    <VStack className="ml-3 flex-1 pr-2">
                        <Text className="text-base font-medium" numberOfLines={1}>
                            {item.name}
                        </Text>
                        <HStack className="items-center mt-0.5">
                            {showOwner && ownerName && (
                                <Text className="text-xs text-blue-600 mr-2">
                                    {ownerName}
                                </Text>
                            )}
                            {!isFolder && item.size && (
                                <Text className="text-xs text-gray-500">
                                    {formatFileSize(item.size)}
                                </Text>
                            )}
                            {item.created_at && (
                                <Text className="text-xs text-gray-400 ml-2">
                                    {formatDate(item.created_at)}
                                </Text>
                            )}
                        </HStack>
                    </VStack>
                </HStack>

                <Menu
                    trigger={({ ...triggerProps }) => (
                        <TouchableOpacity {...triggerProps} className="p-2">
                            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                >
                    {!isFolder && onDownload && (
                        <MenuItem onPress={() => onDownload(item)}>
                            <Ionicons name="download-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Скачать</MenuItemLabel>
                        </MenuItem>
                    )}

                    {!isFolder && onReupload && (
                        <MenuItem onPress={() => onReupload(item)}>
                            <Ionicons name="cloud-upload-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Заменить файл</MenuItemLabel>
                        </MenuItem>
                    )}

                    {onRename && (
                        <MenuItem onPress={() => onRename(item)}>
                            <Ionicons name="pencil-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Переименовать</MenuItemLabel>
                        </MenuItem>
                    )}

                    {/* {onMove && (
                        <MenuItem onPress={() => onMove(item)}>
                            <Ionicons name="move-outline" size={18} color="#333" />
                            <MenuItemLabel className="ml-2">Переместить</MenuItemLabel>
                        </MenuItem>
                    )} */}

                    {!isFolder && onShare && (
                        <>
                            <MenuSeparator />
                            <MenuItem onPress={() => onShare(item)}>
                                <Ionicons name="share-outline" size={18} color="#333" />
                                <MenuItemLabel className="ml-2">Доступ</MenuItemLabel>
                            </MenuItem>
                        </>
                    )}

                    {onDelete && (
                        <>
                            <MenuSeparator />
                            <MenuItem onPress={handleDelete}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                <MenuItemLabel className="ml-2 text-red-500">Удалить</MenuItemLabel>
                            </MenuItem>
                        </>
                    )}
                </Menu>
            </HStack>
            <View className="h-px bg-gray-100 ml-12" />
        </TouchableOpacity>
    )
}

export default FileItem

