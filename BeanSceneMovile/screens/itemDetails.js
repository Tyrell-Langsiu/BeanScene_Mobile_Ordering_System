import React, {useMemo, useState} from 'react';
import {
    View, Text, StyleSheet,
    Image, ScrollView, TextInput,
    TouchableOpacity, useWindowDimensions,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, styles as sharedStyles } from '../styles';
import SelectedTableHeader from '../components/selectedTableheader.js';
import { API_BASE_URL } from '../components/apiFetch.js';

const CART_KEY = 'beanSceneCart';

export default function ItemDetailsScreen({ route, navigation, showBack = false, onBack,}) {
    const {item} = route.params;

    const [quantity, setQuantity] = useState(1);
    const [specialRequests, setSpecialRequests] = useState('');

    const {width} = useWindowDimensions();
    const isTablet = width >= 700;

    const totalPrice = useMemo(() => {
        return Number(item.price || 0) * quantity;
    }, [item.price, quantity]);

    function getImageUrl() {
        const image = item.photoUrl || item.imageUrl || item.photo || item.image;

        if (!image) return null;
        if (image.startsWith('http')) {
            return image;
        }
        return `${API_BASE_URL}${image}`;
    }
    function getDietaryFlags() {
        const flags = item.dietaryFlags || item.dietary || [];

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
    function formatFlag(flag) {
        const lowerFlag = String(flag).toLowerCase();

        if (lowerFlag.includes('vegetarian')) return 'V';
        if (lowerFlag.includes('vegan')) return 'VG';
        if (lowerFlag.includes('gluten')) return 'GF';
        if (lowerFlag.includes('allergen')) return 'A';

        return String(flag).substring(0, 2).toUpperCase();
    }
    function decreaseQuantity() {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    }
    function increaseQuantity() {
        setQuantity(quantity + 1);
    }
    async function addToCart() {
        try {
            const existingCart = await AsyncStorage.getItem(CART_KEY);
            const cart = existingCart ? JSON.parse(existingCart) : [];

            const cartItem = {
                cartItemId: `${item.id || item._id}-${Date.now()}`,
                id: item.id || item._id,
                menuItemId: item.id || item._id,
                name: item.name,
                price: Number(item.price || 0),
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

            await AsyncStorage.setItem(CART_KEY, JSON.stringify(updatedCart));

            Alert.alert('Adding to Cart', `${item.name} has been added to the cart`);

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
                            <Text style={styles.detailsItemName}>{item.name || 'Menu Item'}</Text>

                            <Text style={styles.detailsPrice}>
                                ${Number(item.price || 0).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.detailsFlagsRow}>
                            {flags.map((flag) => (
                                <View key={flag} style={styles.detailsFlagBadge}>
                                    <Text style={styles.detailsFlagText}>{formatFlag(flag)}</Text>
                                </View>
                            ))}
                            {item.isSpecial ? (
                                <View style={styles.detailsSpecialBadge}>
                                    <Text style={styles.detailsSpecialText}>SP</Text>
                                </View>
                            ): null}
                        </View>

                        <Text style={styles.description}>
                            {item.description || 'No description available'}
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
