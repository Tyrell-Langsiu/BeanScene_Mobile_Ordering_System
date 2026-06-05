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

const CART_KEY = 'beanSceneCart';
const TABLE_KEY = 'selectedTable';

const API_URL = 'https://beansceneorderingsystem.onrender.com/api/orders';

export default function CartScreen() {
    const [cartItems, setCartItems] = useState([]);
    const [tableRef, setTableRef] = useState();
    const { width } = useWindowDimensions();

    const isTablet = width >= 700;

    useFocusEffect(
        useCallback(() => {
            loadOrder();
        }, [])
    );
    const loadOrder = async () => {
        try {
            const storedCart = await AsyncStorage.getItem(CART_KEY);
            const storedTable = await AsyncStorage.getItem(TABLE_KEY);

            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
            else {
                setCartItems([]);
            }
            if (storedTable) {
                setTableRef(storedTable);
            }
        } catch (err) {
            console.log('Load order error: ', err);
        }
    };
    const saveCart = async (updatedCart) => {
        setCartItems(updatedCart);
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    };
    const increaseQty = (cartItemId) => {
        const updatedCart = cartItems.map((item) =>
            item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1}
            : item);
         saveCart(updatedCart);
    };

    const decreaseQty = (cartItemId) => {
        const updatedCart = cartItems
        .map((item) =>
            item.cartItemId === cartItemId
            ? {...item, quantity: Math.max(1, item.quantity - 1) }
            : item
        );
        saveCart(updatedCart);
    }
    const removeItem = (cartItemId) => {
        const updatedCart = cartItems.filter((item) => item.cartItemId !== cartItemId);
        saveCart(updatedCart);
    };
    const getSubtotal = () => {
        return cartItems.reduce((total, item) => {
            return total + Number(item.price) * Number(item.quantity);
        }, 0);
    };

    const submitOrder = async () => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Order', 'Please add items before submitting the order');
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            const orderData = {
                tableRef: tableRef,
                items: cartItems.map((item) => ({
                    menuItemId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    notes: item.notes || '',
                })),
                status: 'in-progress',
                notes: '',
                orderDateTime: new Date().toISOString(),
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? {Authorization: `Bearer ${token}`}:{}),
                },
                body: JSON.stringify(orderData),
            });
            if (!response.ok) {
                throw new Error('Failed to submit order');
            }

            await AsyncStorage.removeItem(CART_KEY);
            setCartItems([]);

            Alert.alert('Success', 'Order submitted to kitchen.');
        } catch (err) {
            console.log('Submit order error:', err);

            Alert.alert(
                'Saved Locally',
                'Could not connect to the server. The order remains saved on this device.'
            );
        }
    };

    const subtotal = getSubtotal();

    return (
        <View style={sharedStyles.screen}>
            <View style={sharedStyles.header}>
                <Text style={sharedStyles.headerTitle}>Cart</Text>
            </View>
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
