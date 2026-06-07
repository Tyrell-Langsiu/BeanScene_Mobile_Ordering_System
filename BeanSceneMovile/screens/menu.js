import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet,
    FlatList, TouchableOpacity, Image,
    ScrollView, ActivityIndicator, useWindowDimensions
} from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, styles as sharedStyles } from '../styles';
import {apiFetch, API_BASE_URL} from '../components/apiFetch.js';
import SelectedTableHeader from '../components/selectedTableheader.js';

const MENU_ENDPOINT = '/api/menu-items';
const CATEGORIES_ENDPOINT = '/api/categories';
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

    
    async function loadMenuData() {
        try {
            setLoading(true);
            setErrorMessage('');

            const [menuData, categoryData] = await Promise.all([
                apiFetch(MENU_ENDPOINT),
                apiFetch(CATEGORIES_ENDPOINT),
            ]);
            const loadedItems = Array.isArray(menuData)
                ? menuData
                : menuData.data || menuData.menuItems || menuData.items || [];
            const loadedCategories = Array.isArray(categoryData)
                ? categoryData
                : categoryData.data || categoryData.categories || [];
            const activeCategories = loadedCategories
                .filter((category) => category.isActive !== false)
                .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
            const availableItems = loadedItems.filter(
                (item) => item.isAvailable !== false
            );

            setCategories(activeCategories);
            setMenuItems(availableItems);

            if (activeCategories.length > 0) {
                setSelectedCategoryId(activeCategories[0].id || activeCategories[0]._id);
            }
        } catch (err) {
            console.log(err);
            setErrorMessage(err.message || 'Unable to load menu. Check your internet connection and try again');
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
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}
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
        <View style={sharedStyles.screen}>
            <SelectedTableHeader title="Menu" />
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
  categorySection: {
    backgroundColor: colors.white,
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
    backgroundColor: colors.accent,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: colors.white,
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  itemPrice: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  itemDescription: {
    color: colors.primary,
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
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  flagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  specialBadge: {
    backgroundColor: colors.warning,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  specialText: {
    color: colors.white,
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
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 7,
  },
  retryText: {
    color: colors.white,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
