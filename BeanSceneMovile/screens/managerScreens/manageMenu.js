import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    useWindowDimensions,
    Switch,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { colors, styles as sharedStyles} from '../../styles.js';
import { apiFetch, API_BASE_URL } from '../../components/apiFetch.js';

const MENU_ENDPOINT = '/api/menu-items';
const CATEGORIES_ENDPOINT = '/api/categories';

export default function ManageMenuScreen({navigation}) {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [tabletCategoriesOpen, setTabletCategoriesOpen] = useState(false);

    const { width } = useWindowDimensions();
    const isTablet = width >= 700;

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    async function loadData() {
        try {
            setLoading(true);

            const menuData = await apiFetch(MENU_ENDPOINT);
            const categoryData = await apiFetch(CATEGORIES_ENDPOINT);

            const menuList = Array.isArray(menuData)
                ? menuData
                : menuData.items || menuData.menuItems || [];

            const categoryList = Array.isArray(categoryData)
                ? categoryData
                : categoryData.categories || [];
            
            setMenuItems(menuList);
            setCategories(categoryList);
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message);
        } finally {
            setLoading(false);
        }
    }

    function getItemId(item) {
        return item.id || item._id || item.itemId || item.menuItemId;
    }

    function getItemName(item) {
        return item.name || item.itemName || 'Menu Item';
    }

    function getImageUrl(item) {
        const image = item.photoUrl || item.imageUrl || item.photo || item.image;

        if (!image) return null;

        const imageString = String(image);

        if (imageString.startsWith('http') || imageString.startsWith('file:') || imageString.startsWith('data:')) {
            return imageString;
        }

        return `${API_BASE_URL}${imageString}`;
    }

    function getItemCategory(item) {
        if (typeof item.category === 'string') return item.category;
        if (item.category?.name) return item.category.name;
        if (item.categoryName) return item.categoryName;

        if (item.categoryId) {
            const category = categories.find(
                currentCategory => String(getCategoryId(currentCategory)) === String(item.categoryId)
            );

            if (category) return getCategoryName(category);
        }

        return 'Uncategorised';
    }

    function getPrice(item) {
        const price = item.price || 0;
        return `$${Number(price).toFixed(2)}`;
    }

    function getAvailable(item) {
        if (item.available !== undefined) return item.available;
        if (item.isAvailable !== undefined) return item.isAvailable;
        return true;
    }

    function getDietaryFlags(item) {
        if (Array.isArray(item.dietaryFlags)) return item.dietaryFlags;
        if (typeof item.dietaryFlags === 'object' && item.dietaryFlags !== null) {
            return Object.entries(item.dietaryFlags)
                .filter(([, value]) => value === true)
                .map(([key]) => {
                    if (key === 'vegetarian') return 'V';
                    if (key === 'vegan') return 'VG';
                    if (key === 'glutenFree') return 'GF';
                    return key;
                });
        }
        if (Array.isArray(item.flags)) return item.flags;
        return [];
    }

    function filteredItems() {
        return menuItems.filter(item => {
            const name = getItemName(item).toLowerCase();
            const category = getItemCategory(item).toLowerCase();

            const matchesSearch = name.includes(searchText.toLowerCase());

            const matchesCategory =
                selectedCategory === 'All' ||
                category === selectedCategory.toLowerCase();

            return matchesSearch && matchesCategory;

        });
    }
    function goToAddItem() {
        navigation.navigate('AddMenu');
    }
    function goToEditItem(item) {
        navigation.navigate('EditMenu', { item });
    }
    function goToAddCategory() {
        navigation.navigate('AddCategory');
    }
    function getCategoryName(category) {
        return category?.name || category?.categoryName || 'Category';
    }
    function getCategoryId(category) {
        return category?.id || category?._id;
    }
    function getSelectedCategory() {
        if (selectedCategory === 'All') return null;

        return categories.find(category => getCategoryName(category) === selectedCategory);
    }
    function getCategoryNames() {
        return [
            'All',
            ...categories.map(category => getCategoryName(category)).filter(Boolean),
        ];
    }
    function itemBelongsToCategory(item, category) {
        const categoryId = getCategoryId(category);
        const categoryName = getCategoryName(category).toLowerCase();

        if (categoryId) {
            const categoryIdText = String(categoryId);

            if (String(item.categoryId) === categoryIdText) return true;
            if (String(item.category?._id || item.category?.id) === categoryIdText) return true;
            if (typeof item.category === 'string' && item.category === categoryIdText) return true;
        }

        return getItemCategory(item).toLowerCase() === categoryName;
    }
    function goToEditCategory() {
        const category = getSelectedCategory();

        if (!category) {
            Alert.alert('Select Category', 'Please select a category to edit.');
            return;
        }

        navigation.navigate('EditCategory', { category });
    }
    async function performDeleteCategory(category) {
        const categoryId = getCategoryId(category);
        const itemsToDelete = menuItems.filter(item => itemBelongsToCategory(item, category));

        if (!categoryId) {
            Alert.alert('Error', 'This category is missing an ID and cannot be deleted.');
            return;
        }

        try {
            await Promise.all(
                itemsToDelete.map(item => {
                    const itemId = getItemId(item);

                    if (!itemId) {
                        throw new Error(`${getItemName(item)} is missing an ID and cannot be deleted.`);
                    }

                    return apiFetch(`${MENU_ENDPOINT}/${encodeURIComponent(String(itemId))}`, {
                        method: 'DELETE',
                    });
                })
            );

            await apiFetch(`${CATEGORIES_ENDPOINT}/${encodeURIComponent(String(categoryId))}`, {
                method: 'DELETE',
            });

            const deletedItemIds = itemsToDelete.map(item => String(getItemId(item)));

            setMenuItems(current =>
                current.filter(item => !deletedItemIds.includes(String(getItemId(item))))
            );
            setCategories(current =>
                current.filter(item => String(getCategoryId(item)) !== String(categoryId))
            );
            setSelectedCategory('All');
            Alert.alert(
                'Success',
                itemsToDelete.length > 0
                    ? `Category and ${itemsToDelete.length} menu item${itemsToDelete.length === 1 ? '' : 's'} deleted.`
                    : 'Category deleted.'
            );
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message);
        }
    }
    function deleteCategory() {
        const category = getSelectedCategory();

        if (!category) {
            Alert.alert('Select Category', 'Please select a category to delete.');
            return;
        }

        const itemsToDelete = menuItems.filter(item => itemBelongsToCategory(item, category));
        const itemText = itemsToDelete.length > 0
            ? ` This will also delete ${itemsToDelete.length} menu item${itemsToDelete.length === 1 ? '' : 's'} in that category.`
            : '';
        const message = `Are you sure you want to delete ${getCategoryName(category)}?${itemText}`;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            if (window.confirm(message)) {
                performDeleteCategory(category);
            }
            return;
        }

        Alert.alert(
            'Delete Category',
            message,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => performDeleteCategory(category),
                },
            ]
        );
    }

    async function performDeleteItem(item) {
        const id = getItemId(item);

        if (!id) {
            Alert.alert('Error', 'This menu item is missing an ID and cannot be deleted.');
            return;
        }

        try {
            const idText = String(id);

            setDeletingItemId(idText);

            await apiFetch(`${MENU_ENDPOINT}/${encodeURIComponent(idText)}`, {
                method: 'DELETE',
            });

            setMenuItems(current =>
                current.filter(menuItem => String(getItemId(menuItem)) !== idText)
            );
            Alert.alert('Success', 'Menu item deleted.');
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message);
        } finally {
            setDeletingItemId(null);
        }
    }

    function deleteItem(item) {
        const message = `Are you sure you want to delete ${getItemName(item)}?`;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            if (window.confirm(message)) {
                performDeleteItem(item);
            }
            return;
        }

        Alert.alert(
            'Delete Menu Item',
            message,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => performDeleteItem(item),
                },
            ]
        );
    }
    async function toggleAvailability(item) {
        try {
            const id = getItemId(item);
            const newValue = !getAvailable(item);

            await apiFetch(`${MENU_ENDPOINT}/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    isAvailable: String(newValue),
                }),
            });

            setMenuItems(current => 
                current.map(menuItem => {
                    if (getItemId(menuItem) !== id) return menuItem;

                    return {
                        ...menuItem,
                        isAvailable: newValue,
                        available: newValue,
                    };
                })
            );
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message);

        }
    }
    function renderFlag(flag, index) {
        const text = String(flag).toUpperCase();

        return (
            <View
                key={`${flag}-${index}`}
                style={[
                    styles.flagBadge,
                    text.includes('GF') && styles.gfBadge,
                    text.includes('V') && styles.veganBadge,
                ]}>
                    <Text style={styles.flagText}>{text}</Text>
                </View>
        );
    }
    function renderStatus(item) {
        const available = getAvailable(item);

        return (
            <View style={[styles.statusBadge, available ? styles.availableBadge : styles.unavailableBadge]}>
                <Text style={[styles.statusText, available ? styles.availableText : styles.unavailableText]}>
                    {available ? 'Available' : 'Unavailable'}
                </Text>
            </View>
        );
    }

    function renderCategoryButtons() {
        const categoryNames = getCategoryNames();

        return (
            <View style={styles.mobileCategoryControls}>
                <View style={styles.categoryActionRow}>
                    <TouchableOpacity
                        style={styles.categoryIconButton}
                        onPress={goToAddCategory}
                        activeOpacity={0.85}>
                        <Ionicons name="add" size={18} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.categoryIconButton}
                        onPress={goToEditCategory}
                        activeOpacity={0.85}>
                        <Ionicons name="create-outline" size={17} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.categoryIconButton, styles.deleteCategoryButton]}
                        onPress={deleteCategory}
                        activeOpacity={0.85}>
                        <Ionicons name="trash-outline" size={17} color={colors.white} />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mobileCategoryScroll}
                    contentContainerStyle={styles.categoryRow}>
                    {categoryNames.map(category => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category && styles.categoryButtonActive,
                            ]}
                            onPress={() => setSelectedCategory(category)}>
                                <Text
                                    style={[
                                        styles.categoryButtonText,
                                        selectedCategory === category && styles.categoryButtonTextActive,
                                    ]}>
                                        {category}
                                    </Text>
                            </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
        
    }
    function renderTabletCategoryPanel() {
        if (!isTablet || !tabletCategoriesOpen) return null;

        return (
            <View style={styles.tabletCategoryPanel}>
                {getCategoryNames().map(category => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.categoryButtonActive,
                        ]}
                        onPress={() => {
                            setSelectedCategory(category);
                            setTabletCategoriesOpen(false);
                        }}>
                        <Text
                            style={[
                                styles.categoryButtonText,
                                selectedCategory === category && styles.categoryButtonTextActive,
                            ]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }
    function renderMobileCard(item) {
        const available = getAvailable(item);
        const flags = getDietaryFlags(item);
        const imageUrl = getImageUrl(item);

        return (
            <View key={getItemId(item)} style={styles.mobileCard}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.imagePlaceholder}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder} />
                )}
                <View style={styles.mobileItemInfo}>
                    <Text style={styles.itemName}>{getItemName(item)}</Text>
                    <Text style={styles.itemCategory}>{getItemCategory(item)}</Text>

                    <View style={styles.flagRow}>
                        {flags.map((flag, index) => renderFlag(flag, index))}
                    </View>
                </View>
                <View style={styles.mobileRight}>
                    <Text style={styles.priceText}>{getPrice(item)}</Text>
                <View style={styles.mobileActions}>
                    <Switch
                        value={available}
                        onValueChange={() => toggleAvailability(item)}
                        trackColor={{ false: '#D7DEE0', true: '#8BE3A8'}}
                        thumbColor={available ? '#00C853' : '#F4F3F4'} />
                        <TouchableOpacity onPress={() => goToEditItem(item)}>
                            <Ionicons name="create-outline" size={19} color={colors.secondary || '#4AA6B8'} />

                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => deleteItem(item)}
                            disabled={deletingItemId === String(getItemId(item))}>
                            <Ionicons name="trash-outline" size={19} color="#FF5B6B" />
                        </TouchableOpacity>
                </View> 
            </View>
        </View>
        );
    }
    function renderTabletTable() {
        return (
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.itemColumn]}>Item</Text>
                    <Text style={[styles.tableHeaderText, styles.categoryColumn]}>Category</Text>
                    <Text style={[styles.tableHeaderText, styles.priceColumn]}>Price</Text>
                    <Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
                    <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Actions</Text>
                </View>
                {filteredItems().map(item => {
                    const flags = getDietaryFlags(item);
                    const imageUrl = getImageUrl(item);

                    return (
                        <View key={getItemId(item)} style={styles.tableRow}>
                            <View style={[styles.tableItemCell, styles.itemColumn]}>
                                {imageUrl ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.smallImagePlaceholder}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.smallImagePlaceholder} />
                                )}
                                <View style={styles.tableItemInfo}>
                                    <Text style={styles.itemName}>{getItemName(item)}</Text>
                                    <View style={styles.flagRow}>
                                        {flags.map((flag, index) => renderFlag(flag, index))}
                                    </View>
                                </View>
                            </View>
                            <Text style={[styles.tableText, styles.categoryColumn]}>
                                {getItemCategory(item)}
                            </Text>
                            <Text style={[styles.priceText, styles.priceColumn]}>
                                {getPrice(item)}
                            </Text>
                            <View style={styles.statusColumn}>
                                {renderStatus(item)}
                            </View>
                            <View style={[styles.tableActions, styles.actionsColumn]}>
                                    <TouchableOpacity onPress={() => goToEditItem(item)}>
                                        <Ionicons name="create-outline" size={18} color={colors.secondary || '#4AA6B8'} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => deleteItem(item)}
                                        disabled={deletingItemId === String(getItemId(item))}>
                                        <Ionicons name="trash-outline" size={18} color="#FF5B6B" />
                                    </TouchableOpacity>
                                </View>
                        </View>
                    );
                })}
            </View>
        );
    }
    if (loading) {
        return (
            <View style={sharedStyles.centeredContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading menu items...</Text>
            </View>
        );
    }

    return (
        <View style={sharedStyles.screen}>
            <View style={sharedStyles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={colors.white} />
                    </TouchableOpacity>
                
                <Text style={sharedStyles.headerTitle}>Manage Menu</Text>
            </View>
            <TouchableOpacity
                style={isTablet ? styles.addItemButton : styles.addCircleButton}
                onPress={goToAddItem}>
                    <Ionicons name="add" size={22} color={colors.primary} />
                    {isTablet && <Text style={styles.addItemText}>Add Item</Text>}
                </TouchableOpacity>
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={isTablet ? styles.tabletSearchRow : null}>
                        <View style={[styles.searchBox, isTablet && styles.tabletSearchBox]}>
                            <Ionicons name="search-outline" size={22} color="#7D9AA0" />
                            <TextInput
                                style={styles.searchInput}
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder="Search menu items..."
                                placeholderTextColor="#8AA1A6" />
                        </View>
                        {isTablet ? (
                            <View style={styles.tabletCategoryActions}>
                                <TouchableOpacity
                                    style={styles.tabletCategoryDropdown}
                                    onPress={() => setTabletCategoriesOpen(current => !current)}
                                    activeOpacity={0.85}>
                                    <Text style={styles.dropdownText}>
                                        {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.tabletCategoryIconButton}
                                    onPress={goToAddCategory}
                                    activeOpacity={0.85}>
                                    <Ionicons name="add" size={18} color={colors.white} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.tabletCategoryIconButton}
                                    onPress={goToEditCategory}
                                    activeOpacity={0.85}>
                                    <Ionicons name="create-outline" size={18} color={colors.white} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tabletCategoryIconButton, styles.deleteCategoryButton]}
                                    onPress={deleteCategory}
                                    activeOpacity={0.85}>
                                    <Ionicons name="trash-outline" size={18} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            renderCategoryButtons()
                        )}
                    </View>
                    {renderTabletCategoryPanel()}
                    {isTablet ? renderTabletTable() : filteredItems().map(item => renderMobileCard(item))}
                </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    loadingText: {
        marginTop: 10,
        color: colors.text || '#333',
    },
    addCircleButton: {
        position: 'absolute',
        top: 42,
        right: 20,
        zIndex: 5,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.warning || '#FFD23F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addItemButton: {
        position: 'absolute',
        top: 34,
        right: 20,
        zIndex: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning || '#FFD23F',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 6,
    },
    addItemText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    searchBox: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tabletSearchRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 28,
    },
    tabletSearchBox: {
        flex: 1,
        marginBottom: 0,
    },
    searchInput: {
        flex: 1,
        color: colors.primary,
        fontSize: 14,
    },
    mobileCategoryControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    categoryActionRow: {
        flexDirection: 'row',
        gap: 6,
    },
    mobileCategoryScroll: {
        flex: 1,
    },
    categoryRow: {
        gap: 8,
        paddingRight: 4,
    },
    categoryButton: {
        backgroundColor: '#E5E8E9',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    categoryButtonActive: {
        backgroundColor: colors.accent,
    },
    categoryButtonText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    categoryButtonTextActive: {
        color: colors.white,
    },
    categoryIconButton: {
        backgroundColor: colors.primary,
        borderRadius: 18,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteCategoryButton: {
        backgroundColor: colors.danger,
    },
    tabletCategoryDropdown: {
        width: 190,
        height: 48,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        borderRadius: 8,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tabletCategoryActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    tabletCategoryPanel: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        borderRadius: 8,
        padding: 12,
        marginTop: -16,
        marginBottom: 18,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tabletCategoryIconButton: {
        height: 48,
        width: 48,
        backgroundColor: colors.primary,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownText: {
        color: colors.primary,
        fontWeight: '700',
    },
    mobileCard: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    imagePlaceholder: {
        width: 58,
        height: 58,
        borderRadius: 8,
        backgroundColor: '#DDD',
        marginRight: 12,
    },
    mobileItemInfo: {
        flex: 1,
    },
    itemName: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 15,
        marginBottom: 3,
    },
    itemCategory: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    flagRow: {
        flexDirection: 'row',
        gap: 5,
        flexWrap: 'wrap',
        marginTop: 4,
    },

    flagBadge: {
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
        backgroundColor: '#00C853',
    },
    veganBadge: {
        backgroundColor: '#00C853',
    },
    gfBadge: {
        backgroundColor: '#FF9800',
    },
    flagText: {
        color: colors.white,
        fontSize: 9,
        fontWeight: '800',
    },
    mobileRight: {
        alignItems: 'flex-end',
        gap: 12,
    },
    priceText: {
        color: colors.accent,
        fontWeight: '800',
        fontSize: 14,
    },
    mobileActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    table: {
        backgroundColor: colors.white,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#DDE3E6',
    },
    tableHeader: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    tableHeaderText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '800',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        minHeight: 82,
        borderBottomWidth: 1,
        borderBottomColor: '#E7ECEE',
    },
    tableText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    tableItemCell: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallImagePlaceholder: {
        width: 46,
        height: 46,
        borderRadius: 8,
        backgroundColor: '#DDD',
        marginRight: 14,
    },
    tableItemInfo: {
        flex: 1,
    },
    statusBadge: {
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    availableBadge: {
        backgroundColor: '#DDF8E6',
    },
    unavailableBadge: {
        backgroundColor: '#FFE0E7',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    availableText: {
        color: '#17A05D',
    },
    unavailableText: {
        color: '#D83255',
    },
    tableActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    itemColumn: {
        flex: 2.1,
    },
    categoryColumn: {
        flex: 1.1,
    },
    priceColumn: {
        flex: 0.9,
    },
    statusColumn: {
        flex: 1.1,
    },
    actionsColumn: {
        flex: 0.8,
    },
});
