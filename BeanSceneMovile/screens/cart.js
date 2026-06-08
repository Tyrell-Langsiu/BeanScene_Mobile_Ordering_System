import React, { useCallback, useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, styles as sharedStyles } from '../styles.js';
import SelectedTableHeader from '../components/selectedTableheader.js';
import { apiFetch } from '../components/apiFetch.js';
import { CACHE_KEYS, getCache, removeCache, setCache } from '../components/cache.js';

const CART_KEY = 'beanSceneCart';
const TABLE_KEY = 'selectedTable';
const ORDERS_ENDPOINT = '/api/orders';

/**
 * Shows the active cart, lets staff update quantities, and submits the order.
 *
 * @returns {React.ReactElement} Cart and order submission screen.
 */
export default function CartScreen() {
    const [cartItems, setCartItems] = useState([]);
    const [tableRef, setTableRef] = useState(null);
    const [tableId, setTableId] = useState(null);
    const { width } = useWindowDimensions();

    const isTablet = width >= 700;

    useFocusEffect(
        useCallback(() => {
            loadOrder();
        }, [])
    );
    /**
     * Loads cart contents and the currently selected table from local storage.
     *
     * @returns {Promise<void>} Resolves after local order state is restored.
     */
    const loadOrder = async () => {
        try {
            const storedCart = await getCache(CACHE_KEYS.cart, null);
            const oldStoredCart = storedCart ? null : await AsyncStorage.getItem(CART_KEY);
            const storedTable = await AsyncStorage.getItem(TABLE_KEY);

            if (storedCart) {
                setCartItems(storedCart);
            } else if (oldStoredCart) {
                const parsedCart = JSON.parse(oldStoredCart);

                setCartItems(parsedCart);
                await setCache(CACHE_KEYS.cart, parsedCart);
            }
            else {
                setCartItems([]);
            }

            if (storedTable) {
                const selectedTable = JSON.parse(storedTable);
                setTableRef(selectedTable.tableRef);
                setTableId(selectedTable.tableId);
            }
        } catch (err) {
            console.log('Load order error: ', err);
            setCartItems([]);
            setTableRef(null);
            setTableId(null);
        }
    };
    /**
     * Saves updated cart contents to state and persistent cache.
     *
     * @param {object[]} updatedCart Cart items to persist.
     * @returns {Promise<void>} Resolves after the cart is saved.
     */
    const saveCart = async (updatedCart) => {
        setCartItems(updatedCart);
        await setCache(CACHE_KEYS.cart, updatedCart);
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    };
    /**
     * Increases the quantity of one cart line item.
     *
     * @param {string} cartItemId Unique cart item ID.
     * @returns {void}
     */
    const increaseQty = (cartItemId) => {
        const updatedCart = cartItems.map((item) =>
            item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1}
            : item);
         saveCart(updatedCart);
    };

    /**
     * Decreases a cart line item quantity while keeping the minimum at one.
     *
     * @param {string} cartItemId Unique cart item ID.
     * @returns {void}
     */
    const decreaseQty = (cartItemId) => {
        const updatedCart = cartItems
        .map((item) =>
            item.cartItemId === cartItemId
            ? {...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        );
        saveCart(updatedCart);
    }
    /**
     * Removes one cart line item and saves the updated cart.
     *
     * @param {string} cartItemId Unique cart item ID.
     * @returns {void}
     */
    const removeItem = (cartItemId) => {
        const updatedCart = cartItems.filter((item) => item.cartItemId !== cartItemId);
        saveCart(updatedCart);
    };
    /**
     * Calculates the cart subtotal from each item's price and quantity.
     *
     * @returns {number} Cart subtotal.
     */
    const getSubtotal = () => {
        return cartItems.reduce((total, item) => {
            return total + Number(item.price) * Number(item.quantity);
        }, 0);
    };

    /**
     * Submits the cart as an in-progress order and clears order-related cache.
     *
     * @returns {Promise<void>} Resolves after submission succeeds or an error alert is shown.
     */
    const submitOrder = async () => {
        if (!tableRef || !tableId) {
            Alert.alert(
                'No Table Selected',
                'Please select a table before submitting the order.'
            );
            return;
        }

        if (cartItems.length === 0) {
            Alert.alert(
                'Empty Order',
                'Please add food items before submitting the order.'
            );
            return;
        }
        try {
            const orderData = {
                tableRef: tableRef,
                tableId: tableId,
                items: cartItems.map((item) => ({
                    menuItemId: item.menuItemId || item.id,
                    name: item.name,
                    price: Number(item.price),
                    quantity: Number(item.quantity),
                    notes: item.notes || item.specialRequests || '',
                    specialRequests: item.specialRequests || item.notes || '',
                })),
                status: 'in-progress',
                notes: '',
                total: subtotal,
                orderDateTime: new Date().toISOString(),
            };

            await apiFetch(ORDERS_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(orderData),
            });

            await removeCache(CACHE_KEYS.cart);
            await removeCache(CACHE_KEYS.orders);
            await removeCache(CACHE_KEYS.tableOrders);
            await removeCache(CACHE_KEYS.tables);
            await AsyncStorage.removeItem(CART_KEY);
            await AsyncStorage.removeItem(TABLE_KEY);

            setCartItems([]);
            setTableRef(null);
            setTableId(null);

            Alert.alert('Success', 'Order submitted to kitchen.')
        } catch (err) {
            console.log('Submit order error:', err);

            Alert.alert(
                'Order Failed',
                err.message || 'Could not submit the order. Please try again.'
            );
        }
    };

    const subtotal = getSubtotal();

    return (
        <View style={sharedStyles.screen}>
            <SelectedTableHeader title="Cart"/>
            <ScrollView contentContainerStyle={styles.content}>
                {cartItems.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="cart-outline" size={40} color={colors.primary} />
                        <Text style={styles.emptyTitle}>No items added yet</Text>
                        <Text style={styles.emptyText}>
                            Add items from the Item Details screen.
                        </Text>
                    </View>
                ) : isTablet ? (
                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, {flex: 2}]}>Item</Text>
                            <Text style={styles.th}>Price</Text>
                            <Text style={styles.th}>Qty</Text>
                            <Text style={styles.th}>Total</Text>
                            <Text style={styles.thSmall}></Text>
                        </View>
                        {cartItems.map((item) => (
                            <View key={item.cartItemId} style={styles.tableRow}>
                                <View style={{flex:2}}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {item.notes ? (
                                        <Text style={styles.note}>Note: {item.notes}</Text>
                                    ): null}
                                </View>
                                <Text style={styles.td}>${Number(item.price).toFixed(2)}</Text>
                                <View style={styles.qtyCell}>
                                        <TouchableOpacity
                                            style={styles.qtyButtonSmall}
                                            onPress={() => decreaseQty(item.cartItemId)}>
                                            <Text style={styles.qtyButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.qtyText}>{item.quantity}</Text>
                                        <TouchableOpacity
                                            style={styles.qtyButton}
                                            onPress={() => increaseQty(item.cartItemId)}>
                                                <Text style={styles.qtyButtonTextWhite}>+</Text>
                                            </TouchableOpacity>
                                </View>
                                <Text style={styles.tdBlue}>
                                    ${(Number(item.price) * item.quantity).toFixed(2)}
                                </Text>
                                <TouchableOpacity onPress={() => removeItem(item.cartItemId)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF476F" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ) : (
                    cartItems.map((item) => (
                        <View key={item.cartItemId} style={styles.mobileCard}>
                            <View style={styles.mobileTopRow}>
                                <View>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    {item.notes ? (
                                        <Text style={styles.note}>Note: {item.notes}</Text>
                                    ) : null}
                                </View>
                                <TouchableOpacity onPress={() => removeItem(item.cartItemId)}>
                                    <Ionicons name="trash-outline" size={18} color='#EF476F' />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.mobileBottomRow}>
                                <View style={styles.qtyCell}>
                                    <TouchableOpacity
                                        style={styles.qtyButtonSmall}
                                        onPress={() => decreaseQty(item.cartItemId)}>
                                            <Text style={styles.qtyButtonText}>-</Text>
                                        </TouchableOpacity>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>

                                    <TouchableOpacity
                                        style={styles.qtyButton}
                                        onPress={() => increaseQty(item.cartItemId)} >
                                            <Text style={styles.qtyButtonTextWhite}>+</Text>
                                        </TouchableOpacity>
                                </View>
                                <Text style={styles.tdBlue}>
                                    ${(Number(item.price) * item.quantity).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    ))
                )}

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={submitOrder}>
                    <Text style={styles.submitText}>Submit Order to Kitchen</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    tableText: {
        color: '#FFD60A',
        fontSize: 15,
        fontWeight: '700',
    },
    content: {
        padding: 22,
        paddingBottom: 120,
    },
    emptyBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    emptyTitle: {
        marginTop: 10,
        fontSize: 17,
        fontWeight: '700',
        color: '#073B4C',
    },
    emptyText: {
        marginTop: 5,
        color: '#777',
    },
    tableCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        overflow: 'hidden',
        marginBottom: 20,
    },
    tableHeader: {
        backgroundColor: '#073B4C',
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignItems: 'center',
    },
    th: {
        flex: 1,
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    thSmall: {
        width: 24,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    td: {
        flex: 1,
        color: '#073B4C',
        fontSize: 14,
    },
    tdBlue: {
        flex: 1,
        color: '#2F8CA3',
        fontSize: 14,
        fontWeight: '700',
    },
    itemName: {
        color: '#073B4C',
        fontSize: 15,
        fontWeight: '700',
    },
    note: {
        marginTop: 4,
        color: '#555',
        fontSize: 12,
        fontStyle: 'italic',
    },
    mobileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#DDE3E6',
    },
    mobileTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mobileBottomRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyCell: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyButtonSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#C8D6D9',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    qtyButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4AA3B5',
    },
    qtyButtonText: {
        color: '#7D9AA0',
        fontSize: 18,
        fontWeight: '700',
    },
    qtyButtonTextWhite: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    qtyText: {
        minWidth: 20,
        textAlign: 'center',
        color: '#073B4C',
        fontSize: 15,
        fontWeight: '700',
    },
    summaryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        padding: 18,
        marginBottom: 18,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        color: '#073B4C',
        fontSize: 14,
    },
    summaryValue: {
        color: '#2F8CA3',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5E5',
        marginVertical: 14,
    },
    totalLabel: {
        color: '#073B4C',
        fontSize: 17,
        fontWeight: '800',
    },
    totalValue: {
        color: '#2F8CA3',
        fontSize: 17,
        fontWeight: '800',
    },
    submitButton: {
        backgroundColor: '#4AA3B5',
        paddingVertical: 17,
        borderRadius: 7,
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
