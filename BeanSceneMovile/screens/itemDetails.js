import React, {useEffect, useMemo, useState} from 'react';
import {
    View, Text, StyleSheet,
    Image, ScrollView, TextInput,
    TouchableOpacity, useWindowDimensions,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles as sharedStyles } from '../styles';
import SelectedTableHeader from '../components/selectedTableheader.js';
import { API_BASE_URL } from '../components/apiFetch.js';
import { CACHE_KEYS, getCache, setCache } from '../components/cache.js';

/**
 * Displays a selected menu item and lets staff add it to the current cart.
 *
 * @param {object} props Screen props.
 * @param {object} props.route Route params containing the selected menu item.
 * @param {object} props.navigation React Navigation object.
 * @param {boolean} [props.showBack=false] Optional legacy flag for showing back navigation.
 * @param {Function} [props.onBack] Optional legacy back handler.
 * @returns {React.ReactElement} Item details screen.
 */
export default function ItemDetailsScreen({ route, navigation, showBack = false, onBack,}) {
    const {item} = route.params;

    const [displayItem, setDisplayItem] = useState(item);
    const [quantity, setQuantity] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');

    const {width} = useWindowDimensions();
    const isTablet = width >= 700;

    const totalPrice = useMemo(() => {
        return Number(displayItem.price || 0) * quantity;
    }, [displayItem.price, quantity]);

    useEffect(() => {
        loadCachedItemDetails();
    }, []);

    /**
     * Loads cached details for the selected item and refreshes the cache with current route data.
     *
     * @returns {Promise<void>} Resolves after cache lookup and update complete.
     */
    async function loadCachedItemDetails() {
        const itemId = item.id || item._id;

        if (!itemId) return;

        const cacheKey = CACHE_KEYS.menuItemDetails(itemId);
        const cachedItem = await getCache(cacheKey, null);

        if (cachedItem) {
            setDisplayItem({
                ...cachedItem,
                ...item,
            });
        }

        await setCache(cacheKey, item);
    }

    /**
     * Builds a renderable image URI from the selected item image fields.
     *
     * @returns {?string} Renderable image URI or null when no image exists.
     */
    function getImageUrl() {
        const image = displayItem.photoUrl || displayItem.imageUrl || displayItem.photo || displayItem.image;

        if (!image) return null;
        if (image.startsWith('http') || image.startsWith('file:') || image.startsWith('data:')) {
            return image;
        }
        return `${API_BASE_URL}${image}`;
    }
    /**
     * Normalises dietary flags from the selected item for badge rendering.
     *
     * @returns {string[]} Dietary flag values.
     */
    function getDietaryFlags() {
        const flags = displayItem.dietaryFlags || displayItem.dietary || [];

        if (Array.isArray(flags)) {
            return flags;
        }
        if (typeof flags === 'object' && flags !== null) {
            return Object.entries(flags)
            .filter(([key, value]) => value === true)
            .map(([key]) => {
                if (key === 'vegetarian') return 'V';
                if (key === 'vegan') return 'VG';
                if (key === 'glutenFree') return 'GF';
                return key;
            });
        }

        return [];
    }
    /**
     * Converts a dietary flag into the compact text used by the details badge.
     *
     * @param {string} flag Raw dietary flag value.
     * @returns {string} Short badge label.
     */
    function formatFlag(flag) {
        const lowerFlag = String(flag).toLowerCase();

        if (lowerFlag.includes('vegetarian')) return 'V';
        if (lowerFlag.includes('vegan')) return 'VG';
        if (lowerFlag.includes('gluten')) return 'GF';
        if (lowerFlag.includes('allergen')) return 'A';

        return String(flag).substring(0, 2).toUpperCase();
    }
    /**
     * Decreases the quantity selector without allowing values below one.
     *
     * @returns {void}
     */
    function decreaseQuantity() {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    }
    /**
     * Increases the quantity selector by one.
     *
     * @returns {void}
     */
    function increaseQuantity() {
        setQuantity(quantity + 1);
    }
    /**
     * Adds the configured item, quantity, and notes to the cached cart.
     *
     * @returns {Promise<void>} Resolves after the cart is saved.
     */
    async function addToCart() {
        try {
            const cart = await getCache(CACHE_KEYS.cart, []);

            const cartItem = {
                cartItemId: `${displayItem.id || displayItem._id}-${Date.now()}`,
                id: displayItem.id || displayItem._id,
                menuItemId: displayItem.id || displayItem._id,
                name: displayItem.name,
                price: Number(displayItem.price || 0),
                quantity: quantity,
                notes: specialRequests,
                specialRequests: specialRequests,
                totalPrice: totalPrice,
                imageUrl: getImageUrl(),
            };
            const existingItem = cart.find(
              (cartItemExisting) =>
                cartItemExisting.menuItemId === cartItem.menuItemId &&
                cartItemExisting.specialRequests === cartItem.specialRequests
            );

            let updatedCart;

            if (existingItem) {
              updatedCart = cart.map((cartItemExisting) =>
                cartItemExisting.menuItemId === cartItem.menuItemId &&
                cartItemExisting.specialRequests === cartItem.specialRequests
                ? {
                  ...cartItemExisting,
                  quantity: cartItemExisting.quantity + quantity,
                  totalPrice:
                    Number(cartItemExisting.price) *
                    (cartItemExisting.quantity + quantity),
                } : cartItemExisting
              );
            } else {
              updatedCart = [...cart, cartItem];
            }

            await setCache(CACHE_KEYS.cart, updatedCart);

            Alert.alert('Adding to Cart', `${displayItem.name} has been added to the cart`);

            navigation.navigate('MenuList');
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Could not add item to cart.');
        }
    }

    const imageUrl = getImageUrl();
    const flags = getDietaryFlags();

    return (
        <View style={sharedStyles.screen}>
            <SelectedTableHeader
              title="Item Details"
              showBack={true}
              onBack={() => navigation.goBack()} />
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={[
                    styles.content,
                    isTablet && styles.tabletContent,
                ]}
                showsVerticalScrollIndicator={true}
            >
                <View style={[styles.detailsContainer, isTablet && styles.tabletDetailsContainer]}>
                    {imageUrl ? (
                        <Image
                            source={{uri: imageUrl}}
                            style={isTablet ? styles.detailsTabletImage : styles.detailsMobileImage}
                            />
                    ) : (
                        <View style={isTablet ? styles.detailsTabletImagePlaceholder : styles.detailsMobileImagePlaceholder} />
                    )}

                    <View style={[styles.infoSection, isTablet && styles.tabletInfoSection]}>
                        <View style={styles.titleRow}>
                            <Text style={styles.detailsItemName}>{displayItem.name || 'Menu Item'}</Text>

                            <Text style={styles.detailsPrice}>
                                ${Number(displayItem.price || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.detailsFlagsRow}>
                            {flags.map((flag) => (
                                <View key={flag} style={styles.detailsFlagBadge}>
                                    <Text style={styles.detailsFlagText}>{formatFlag(flag)}</Text>
                                </View>
                            ))}
                            {displayItem.isSpecial ? (
                                <View style={styles.detailsSpecialBadge}>
                                    <Text style={styles.detailsSpecialText}>SP</Text>
                                </View>
                            ): null}
                        </View>

                        <Text style={styles.description}>
                            {displayItem.description || 'No description available'}
                        </Text>
                        <Text style={styles.sectionLabel}>Quantity</Text>
                        <View style={styles.quantityRow}>
                            <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                                <Ionicons name="remove" size={22} color="#4AA9B8" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>

                            <TouchableOpacity style={styles.quantityButtonFilled} onPress={increaseQuantity}>
                                <Ionicons name="add" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sectionLabel}>Special Requests</Text>
                        <TextInput
                            style={styles.requestInput}
                            placeholder='Any dietary requirements or modifications...'
                            placeholderTextColor="#9CB4B9"
                            value={specialRequests}
                            onChangeText={setSpecialRequests}
                            multiline
                            />
                        <TouchableOpacity style={styles.addButton} onPress={addToCart}>
                            <Text style={styles.addButtonText}>
                                Add to Cart - ${totalPrice.toFixed(2)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
  detailsHeader: {
    height: 86,
    backgroundColor: colors.primary,
    paddingTop: 34,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 8,
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 110,
  },
  tabletContent: {
    paddingHorizontal: 28,
    paddingTop: 26,
  },
  detailsContainer: {
    flex: 1,
  },
  tabletDetailsContainer: {
    flexDirection: 'row',
    gap: 28,
  },
  detailsMobileImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#D9D9D9',
  },
  detailsMobileImagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#D9D9D9',
  },
  detailsTabletImage: {
    width: '48%',
    height: 270,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
  },
  detailsTabletImagePlaceholder: {
    width: '48%',
    height: 270,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
  },
  infoSection: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  tabletInfoSection: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailsItemName: {
    flex: 1,
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29,
  },
  detailsPrice: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  detailsFlagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
    marginBottom: 18,
  },
  detailsFlagBadge: {
    backgroundColor: colors.success,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  detailsSpecialBadge: {
    backgroundColor: colors.warning,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  detailsFlagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  detailsSpecialText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  description: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 26,
  },
  quantityButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  quantityButtonFilled: {
    width: 43,
    height: 43,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  quantityText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  requestInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    color: colors.primary,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
    marginBottom: 28,
  },
  addButton: {
    height: 56,
    backgroundColor: colors.accent,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
