import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles as sharedStyles } from '../styles';
import { apiFetch } from '../components/apiFetch.js';
import SelectedTableHeader from '../components/selectedTableheader.js';
const TABLES_ENDPOINT = '/api/tables'

const fallbackTables = [
    ...Array.from({ length: 10}, (_, i) => ({
        id: `M${i + 1}`,
        tableRef: `M${i + 1}`,
        area: 'Main',
        status: i === 1 || i === 4 || i === 7 ? 'occupied' : i === 3 || i === 8 ? 'reserved' : 'available',
    })),
    ...Array.from({ length: 10}, (_, i) => ({
        id: `O${i + 1}`,
        tableRef: `O${i + 1}`,
        area: 'Outside',
        status: i === 0 || i === 2 || i === 5 ? 'occupied' : i === 1 || i === 6 ? 'reserved' : 'available',
    })),
    ...Array.from({ length: 10}, (_, i) => ({
        id: `B${i + 1}`,
        tableRef: `B${i + 1}`,
        area: 'Balcony',
        status: i === 3 || i === 6 || i === 9 ? 'occupied' : i === 0 || i === 4 ? 'reserved' : 'available',
    })),
];

export default function TableScreen({ navigation }) {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedTableRef, setSelectedTableRef] = useState('No table')

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        try {
            setLoading(true);
            const data = await apiFetch(TABLES_ENDPOINT);
            setTables(data);
        } catch (err) {
            console.log('Table fetch error', err.message);

            setTables(fallbackTables);
        } finally {
            setLoading(false);
        }
    };
    const groupedTables = {
        Main: tables.filter(table => table.area === 'Main'),
        Outside: tables.filter(table => table.area === 'Outside'),
        Balcony: tables.filter(table => table.area === 'Balcony'),
    };
    const handleTablePress = async (table) => {
        if (table.status === 'occupied') {
            Alert.alert('Table Occupied', 'This table is currently occupied. Please select another table.');
            return;
        }
        if (selectedTableId === table.id) {
            setSelectedTableId(null);
            setSelectedTableRef('No Table');
            await AsyncStorage.removeItem('selectedTable');
            return;
        }

        setSelectedTableId(table.id);
        setSelectedTableRef(table.tableRef);

        await AsyncStorage.setItem('selectedTable', JSON.stringify({
            tableRef: table.tableRef,
            tableId: table.id,
        }));
    };
    const renderTableButton = (table) => {
        const isSelected = selectedTableId === table.id;
        return (
            <TouchableOpacity
                key={table.id}
                style={[
                    styles.tableButton,
                    table.status === 'available' && styles.availableTable,
                    table.status === 'occupied' && styles.occupiedTable,
                    table.status === 'reserved' && styles.reservedTable,
                    isSelected && styles.selectedTable,
                ]}
                onPress={() => handleTablePress(table)}
                activeOpacity={0.8}
            >
                <Text
                    style={[
                        styles.tableText,
                        table.status === 'available' && styles.availableText,
                        table.status === 'occupied' && styles.occupiedText,
                        table.status === 'reserved' && styles.reservedText,
                        isSelected && styles.selectedTableText,
                    ]}
                >
                    {table.tableRef}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderArea = (title, areaKey) => {
        return (
            <View style={styles.areaCard}>
                <Text style={styles.areaTitle}>{title}</Text>
                <View style={styles.tableGrid}>
                    {groupedTables[areaKey].map(renderTableButton)}
                </View>
            </View>
        );
    };
    if (loading) {
        return (
            <View style={sharedStyles.centeredContainer}>
                <ActivityIndicator size="large" color="#06464E" />
                <Text style={styles.loadingText}>Loading tables...</Text>
            </View>
        );
    }
    
    return (
        <View style={sharedStyles.screen}>
            <SelectedTableHeader title={"Tables"} selectedTableRef={selectedTableRef} />
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.availableDot]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.occupiedDot]} />
                    <Text style={styles.legendText}>Occupied</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.reservedDot]} />
                    <Text style={styles.legendText}>Reserved</Text>
                </View>
            </View>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator
                >
                    {renderArea('Main Dining (M)', 'Main')}
                    {renderArea('Outside Seating (O)', 'Outside')}
                    {renderArea('Balcony (B)', 'Balcony')}
            </ScrollView>
        </View>
    )
    
}

const styles = StyleSheet.create({
    loadingText: {
        marginTop: 10,
        color: '#06464E',
        fontWeight: '600',
    },
    legendContainer: {
        backgroundColor: '#ffff',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E1E5E8',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 11,
        height: 11,
        borderRadius: 6,
        marginRight: 6,
    },
    availableDot: {
        backgroundColor: '#16C968',
    },
    occupiedDot: {
        backgroundColor: '#F2BE2C',
    },
    reservedDot: {
        backgroundColor: '#4EA8B9',
    },
    legendText: {
        fontSize: 12,
        color: '#16414A',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    areaCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDE2E5',
        padding: 16,
        marginBottom: 16,
    },
    areaTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#06464E',
        marginBottom: 14,
    },
    tableGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tableButton: {
        width: 48,
        height: 48,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    availableTable: {
        backgroundColor: '#CFF6DD',
        borderColor: '#16C968',
    },
    occupiedTable: {
        backgroundColor: '#FFF3C7',
        borderColor: '#F2BE2C',
    },
    reservedTable: {
        backgroundColor: '#D9EEF3',
        borderColor: '#4EA8B9',
    },
    tableText: {
        fontSize: 14,
        fontWeight: '700',
    },
    availableText: {
        color: '#08793C',
    },
    occupiedText: {
        color: '#B47D00',
    },
    reservedText: {
        color: '#287A8A',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F5F7F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedTable: {
        backgroundColor: '#D1D5DB',
        borderColor: '#6B7280',
    },
    selectedTableText: {
        color: '#374151'
    }
});
