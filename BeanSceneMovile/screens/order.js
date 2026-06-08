import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useWindowDimensions
} from 'react-native';
import { colors, styles as sharedStyles } from '../styles';
import { apiFetch } from '../components/apiFetch';
import SelectedTableHeader from '../components/selectedTableheader';

const ORDERS_ENDPOINT = '/api/orders';

export default function OrderScreen() {
    const  { width } = useWindowDimensions();
    const cardWidth = width >= 700 ? '48%' : '100%';
    const [orders, setOrders] = useState([]);
    const [selectedTab, setSelectedTab] = useState('in-progress');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            setLoading(true);
            
            const data = await apiFetch(ORDERS_ENDPOINT);

            const formattedOrders = data.map(order => ({
                id: order._id || order.id,
                tableRef: order.tableRef || order.tableId || 'Unknown',
                status: order.status || 'in-progress',
                orderTime: formatOrderTime(order.orderedAt || order.orderDateTime || order.createdAt),
                total: order.totalAmount ?? order.total ?? calculateTotal(order.items || []),
                items: order.items || [],
                notes: order.notes || '',
            }));

            setOrders(formattedOrders);
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Unable to load orders. Please try again later.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }
    function formatOrderTime(dateValue) {
        if (!dateValue) return 'Now';

        const date = typeof dateValue === 'object' && dateValue.seconds
            ? new Date(dateValue.seconds * 1000)
            : new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return 'Now';
        }

        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    function calculateTotal(items) {
        if (!Array.isArray(items)) {
            return 0;
        }
        return items.reduce((sum, item) => {
            return sum + (item.price || 0) * (item.quantity || 1);
        }, 0);
    }
    async function markServed(orderId) {
        try {
            await apiFetch(`${ORDERS_ENDPOINT}/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed' }),
            });
            setOrders(currentOrders =>
                currentOrders.map(order =>
                    order.id === orderId
                    ? { ...order, status: 'completed' }
                    : order
                )
            );
            Alert.alert('Order Updated', 'The order has been marked as completed.');
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Unable to update order status. Please try again later.');
        }
        
    };
    const inProgressorders = orders.filter(
            order => order.status === 'in-progress'
    );
    const completedOrders = orders.filter(
        order => order.status === 'completed'
    );
    const visibleOrders = 
        selectedTab === 'in-progress' ? inProgressorders : completedOrders;
    if (loading) {
        return (
            <View style={sharedStyles.centeredContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
        );
    }
    return (
            <View style={sharedStyles.screen}>
                <SelectedTableHeader title="Order"/>
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === 'in-progress' && styles.activeTab,
                        ]}
                        onPress={() => setSelectedTab('in-progress')}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedTab === 'in-progress' && styles.activeTabText,
                                ]}>
                                    In Progress ({inProgressorders.length})
                                </Text>
                        </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            selectedTab === 'completed' && styles.activeTab,
                        ]}
                        onPress={() => setSelectedTab('completed')}>
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedTab === 'completed' && styles.activeTabText,
                                ]}>
                                    Completed ({completedOrders.length})
                                </Text>
                        </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.orderGrid}>
                        {visibleOrders.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No orders found</Text>
                            </View>
                        ) : (
                            visibleOrders.map(order => (
                                <View
                                    key={order.id}
                                    style={[styles.orderCard, {width: cardWidth}]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.tableText}>
                                                Table{'\n'}
                                                {order.tableRef}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    order.status === 'completed' &&
                                                    styles.completedBadge
                                                ]}>
                                                    <Text
                                                        style={[
                                                            styles.statusText,
                                                            order.status === 'completed' &&
                                                                styles.completedStatusText,
                                                        ]}>
                                                            {order.status === 'in-progress'
                                                                ? 'In Progress'
                                                                : 'Completed'}
                                                        </Text>
                                                </View>
                                                <Text style={styles.timeText}>{order.orderTime}</Text>
                                        </View>
                                        <View style={styles.itemContainer}>
                                            {order.items.map((item, index) => (
                                                <View key={index} style={styles.itemRow}>
                                                    <Text style={styles.itemText}>
                                                        {item.quantity || 1} x {item.name}
                                                    </Text>
                                                    {item.note || item.specialRequests ? (
                                                        <Text style={styles.noteText}>
                                                            {item.note || item.specialRequests}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            ))}
                                        </View>
                                        {order.notes ? (
                                            <Text style={styles.orderNote}>Note: {order.notes}</Text>
                                        ) : null}
                                        <View style={styles.cardFooter}>
                                            <Text style={styles.totalText}>
                                                ${Number(order.total || 0).toFixed(2)}
                                            </Text>
                                            {order.status === 'in-progress' && (
                                                <TouchableOpacity
                                                    style={styles.servedButton}
                                                    onPress={() => markServed(order.id)}
                                                >
                                                    <Text style={styles.servedButtonText}>
                                                        ✓ Mark Served
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}
                    </View>
                </ScrollView>
            </View>
    )
}

const styles = StyleSheet.create({
    loadingText: {
        marginTop: 10,
        color: colors.primary,
        fontWeight: '600',
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#D9E2E4'
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4CA7B7',
    },
    tabText: {
        fontSize: 14,
        color: colors.primary,
    },
    activeTabText: {
        fontWeight: '700',
    },
    scrollContent: {
        padding: 14,
        paddingBottom: 90,
    },
    orderGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    orderCard: {
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 14,
        borderWidth: 1,
        borderColor: '#DDE5E7',
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    tableText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
        flex: 1,
    },
    statusBadge: {
        backgroundColor: '#FFF4C7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginRight: 8,
    },
    statusText: {
        color: '#B58A00',
        fontSize: 12,
        fontWeight: '700',
    },
    completedBadge: {
        backgroundColor: '#D1FADF',
    },
    completedStatusText: {
        color: '#027A48',
    },
    timeText: {
        fontSize: 13,
        color: colors.primary,
        textAlign: 'right',
    },
    itemContainer: {
        marginTop: 4,
    },
    itemRow: {
        marginBottom: 5,
    },
    itemText: {
        fontSize: 14,
        color: '#123236',
    },
    noteText: {
        fontSize: 12,
        color: '#62777B',
        fontStyle: 'italic',
        marginLeft: 12,
    },
    orderNote: {
        fontSize: 12,
        color: '#62777B',
        marginTop: 8,
        fontStyle: 'italic',
    },
    cardFooter: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#E6ECEE',
        paddingTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#4CA7B7',
    },
    servedButton: {
        backgroundColor: '#12B76A',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
    },
    servedButtonText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    emptyCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDE5E7',
    },
    emptyText: {
        color: '#62777B',
    },
})
