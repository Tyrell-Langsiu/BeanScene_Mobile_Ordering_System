import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { colors, styles as sharedStyles } from '../styles.js';

export default function SelectedTableHeader({
    title,
    selectedTableRef,
    showBack = false,
    onBack,
}) {
    const [savedTableRef, setSavedTableRef] = useState('No table');

    useEffect(() => {
        loadSelectedTable();

        const interval = setInterval(() => {
            loadSelectedTable();
        }, 500);
        return () => clearInterval(interval);
    }, []);

   async function loadSelectedTable() {
    try {
        const savedTable = await AsyncStorage.getItem('selectedTable');

        if (savedTable) {
            const table = JSON.parse(savedTable);
            setSavedTableRef(table.tableRef || 'No table');
        } else {
            setSavedTableRef('No table');
        }
    } catch (err) {
        console.log('Failed to load selected table', err);
        setSavedTableRef('No table');
    }
   }

   const tableText = selectedTableRef || savedTableRef || 'No table';

   return (
    <View style={sharedStyles.header}>
        {showBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
        ): null}
        <Text style={sharedStyles.headerTitle}>{title}</Text>

        <Text style={styles.selectedTableText}>
            Table: {tableText}
        </Text>
    </View>
   );
}

const styles = StyleSheet.create({
    selectedTableText: {
        color: colors.warning,
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 'auto',
    }
})
