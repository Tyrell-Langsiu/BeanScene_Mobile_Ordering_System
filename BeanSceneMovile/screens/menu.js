import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet,
    FlatList, TouchableOpacity, Image,
    ScrollView, ActivityIndicator, useWindowDimensions
} from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://beansceneorderingsystem.onrender.com';
const MENU_URL = `${API_BASE_URL}/api/menu-items`;
const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;

export default function MenuScreen({navigation}) {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([{ id: 'all', name: 'Entrees'}]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const { width } = useWindowDimensions();
    const isTablet = width >= 700;

    useEffect(() => {
        loadMenuData();
    }, []);

    async function getHeaders() {
        const token = await AsyncStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }
    async function loadMenuData() {
        try {
            setLoading(true);
            setErrorMessage('');
            const headers = await getHeaders();
            const [menuResponse, categoriesResponse] = await Promise.all([
                fetch(MENU_URL, { headers }),
                fetch(CATEGORIES_URL, { headers }),
            ]);
            if (menuResponse.status === 401 || categoriesResponse.status === 401) {
                setErrorMessage('Your session has expired. Please log in again.');
                return;
            }
            if (!menuResponse.ok) {
                throw new Error('Failed to load menu items');
            }
            if (!categoriesResponse.ok) {
                throw new Error('Failed to load categories');
            }
            const menuData = await menuResponse.json();
            const categoryData = await categoriesResponse.json();

            const loadedItems = Array.isArray(menuData)
                ? menuData
                : menuData.data || menuData.menuItems || menuData.items || [];
            const loadedCategories = Array.isArray(categoryData)
                ? categoryData
                : categoryData.data || categoryData.categories || [];
            const activeCategories = loadedCategories
                .filter((category) => category.isActive !== false)
                .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
            const availableItems = loadedItems.filter((item) => item.isAvailable !== false);
            setCategories(activeCategories);

            if (activeCategories.length > 0) {
                setSelectedCategoryId(activeCategories[0].id || activeCategories[0]._id);
            }

            setMenuItems(availableItems);
        } catch (err) {
            console.log(err);
            setErrorMessage('Unable to load menu. check your internet connection and try again.');
        } finally {
            setLoading(false);
        }
    }
    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            const itemCategoryId =
            item.categoryId ||
            item.category?._id ||
            item.category?.id ||
            item.category;
            return String(itemCategoryId) === String(selectedCategoryId);
        });
    }, [menuItems, selectedCategoryId]);

    function getImageUrl(item) {
        const image = item.photoUrl || item.imageUrl || item.photo || item.image;
        if (!image) return null;
        if (image.startsWith('http')) {
            return image;
        }
        return `${API_BASE_URL}${image}`;
    }
    function getDietaryFlags(item) {
        const flags = item.dietaryFlags || item.dietary || [];
        if (Array.isArray(flags)) {
            return flags;
        }
        if (typeof flags === 'object' && flags !== null) {
            return Object.entries(flags)
            .filter(([key, value]) => value === true)
            .map(([key]) => key);
        }
        return [];
    }
    function formatFlag(flag) {
        const lowerFlag = String(flag).toLowerCase();
        if (lowerFlag.includes('vegetarian')) return 'V';
        if (lowerFlag.includes('vegan')) return 'VG';
        if (lowerFlag.includes('gluten')) return 'GF';
        if (lowerFlag.includes('allergen')) return 'A';

        return String(flag).substring(0, 2).toUpperCase();
    }
    function openItemDetails(item) {
        navigation.navigate('ItemDetails', { item});
    }
    function renderCategory(category) {
        const categoryId = category.id || category._id;
        const isSelected = String(selectedCategoryId) === String(categoryId);
        return (
            <TouchableOpacity
                key={categoryId}
                style={[styles.categoryButton, isSelected && styles.categoryButtonActive]}
                onPress={() => setSelectedCategoryId(categoryId)}
            >
                <Text style={[styles.categoryText, isSelected && styles.categoryButtonActive]}
                onPress={() => setSelectedCategoryId(categoryId)}
                >
                    {category.name}
                </Text>
            </TouchableOpacity>
        );
    }
    function renderMenuItem({ item }) {
        const imageUrl = getImageUrl(item);
        const flags = getDietaryFlags(item);

        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openItemDetails(item)}
                style={[styles.card, isTablet && styles.tabletCard]}
                >
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={isTablet ? styles.tabletImage : styles.mobileImage}
                            />
                    ) : (
                        <View style={isTablet ? styles.tabletImagePlaceholder : styles.mobileImagePlaceholder}/>
                    )}
                    <View style={styles.itemInfo}>
                        <View style={styles.itemHeader}>
                            <Text style={styles.itemName} numberOfLines={isTablet ? 1 : 1}>
                                {item.name}
                            </Text>
                            <Text style={styles.itemPrice}>
                                ${Number(item.price || 0).toFixed(2)}
                            </Text>
                        </View>
                        <Text style={styles.itemDescription} numberOfLines={2}>
                            {item.description || 'No description available.'}
                        </Text>
                        <View style={styles.flagsRow}>
                            {flags.map((flag) => (
                                <View key={flag} style={styles.flagBadge}>
                                    <Text style={styles.flagText}>{formatFlag(flag)}</Text>
                                </View>
                            ))}
                            {item.isSpecial ? (
                                <View style={styles.specialBadge}>
                                    <Text style={styles.specialText}>SP</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
            </TouchableOpacity>
        );
    }
    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Menu</Text>
            </View>
            <View style={styles.categorySection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContent}
                >
                    {categories.map(renderCategory)}
                </ScrollView>
            </View>
            <View style={styles.fakeScrollRow}>
                <Ionicons name="caret-back" size={18} color="#8A8A8A" />
                <View style={styles.fakeScrollTrack}>
                    <View style={styles.fakeScrollThumb} />
                </View>
                <Ionicons name="caret-forward" size={18} color="#8A8A8A" />
            </View>
            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#073F48" />
                    <Text style={styles.loadingText}>Loading menu...</Text>
                </View>
            ) : errorMessage ? (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadMenuData}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>

            ) : (
                <FlatList
                    data={filteredMenuItems}
                    key={isTablet ? 'tablet-grid' : 'phone-list'}
                    numColumns={isTablet ? 2 : 1}
                    keyExtractor={(item, index) => String(item.id || item._id || index)}
                    renderItem={renderMenuItem}
                    contentContainerStyle={[
                        styles.listContent,
                        isTablet && styles.tabletListContent,
                    ]}
                    showsVerticalScrollIndicator={true}
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <Text style={styles.emptyText}> No menu items in this category</Text>
                        </View>
                    }
                />
            )}
        </View>
        
    );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7F7',
  },

  header: {
    height: 86,
    backgroundColor: '#073F48',
    paddingHorizontal: 22,
    paddingTop: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  tableText: {
    color: '#FFD325',
    fontSize: 15,
    fontWeight: '800',
  },

  categorySection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },

  categoryContent: {
    paddingHorizontal: 18,
  },

  categoryButton: {
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: '#E3E3E3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  categoryButtonActive: {
    backgroundColor: '#4AA9B8',
  },

  categoryText: {
    color: '#073F48',
    fontSize: 14,
    fontWeight: '700',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  fakeScrollRow: {
    marginTop: 9,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  fakeScrollTrack: {
    flex: 1,
    height: 13,
    justifyContent: 'center',
  },

  fakeScrollThumb: {
    height: 11,
    width: '55%',
    borderRadius: 10,
    backgroundColor: '#909090',
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 100,
  },

  tabletListContent: {
    paddingHorizontal: 26,
    paddingTop: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 7,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    flex: 1,
  },

  tabletCard: {
    flexDirection: 'column',
    marginHorizontal: 8,
    padding: 18,
    minHeight: 220,
  },

  mobileImage: {
    width: 78,
    height: 78,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
    marginRight: 14,
  },

  mobileImagePlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
    marginRight: 14,
  },

  tabletImage: {
    width: '100%',
    height: 112,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
    marginBottom: 16,
  },

  tabletImagePlaceholder: {
    width: '100%',
    height: 112,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
    marginBottom: 16,
  },

  itemInfo: {
    flex: 1,
  },

  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },

  itemName: {
    flex: 1,
    color: '#073F48',
    fontSize: 17,
    fontWeight: '700',
  },

  itemPrice: {
    color: '#4AA9B8',
    fontSize: 16,
    fontWeight: '800',
  },

  itemDescription: {
    color: '#073F48',
    fontSize: 13,
    lineHeight: 18,
  },

  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },

  flagBadge: {
    backgroundColor: '#00C853',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  flagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  specialBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  specialText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  loadingText: {
    marginTop: 10,
    color: '#073F48',
    fontWeight: '600',
  },

  errorText: {
    color: '#C0392B',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 14,
  },

  retryButton: {
    backgroundColor: '#4AA9B8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 7,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  emptyText: {
    color: '#073F48',
    fontWeight: '700',
  },
});
