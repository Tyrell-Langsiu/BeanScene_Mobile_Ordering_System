import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { colors, styles as sharedStyles } from '../styles.js';
import OfflineHeaderBadge from './offlineHeaderBadge.js';

export default function SelectedTableHeader({
    title,
    selectedTableRef,
    showBack = false,
    onBack,
}) {
    const [savedTableRef, setSavedTableRef] = useState('No table');
    const [signedInUser, setSignedInUser] = useState(null);

    useEffect(() => {
        loadHeaderData();

        const interval = setInterval(() => {
            loadHeaderData();
        }, 500);
        return () => clearInterval(interval);
    }, []);

   async function loadHeaderData() {
    try {
        const savedTable = await AsyncStorage.getItem('selectedTable');
        const savedUser = await AsyncStorage.getItem('user');

        if (savedTable) {
            const table = JSON.parse(savedTable);
            setSavedTableRef(table.tableRef || 'No table');
        } else {
            setSavedTableRef('No table');
        }

        if (savedUser) {
            setSignedInUser(JSON.parse(savedUser));
        } else {
            setSignedInUser(null);
        }
    } catch (err) {
        console.log('Failed to load header data', err);
        setSavedTableRef('No table');
        setSignedInUser(null);
    }
   }

   function getUserName(user) {
    return (
        user?.fullName ||
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        user?.name ||
        user?.email ||
        'Signed in'
    );
   }

   const tableText = selectedTableRef || savedTableRef || 'No table';
   const userText = getUserName(signedInUser);
   const roleText = signedInUser?.role ? ` (${signedInUser.role})` : '';

   return (
    <>
        <View style={sharedStyles.header}>
            {showBack ? (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
            ): null}
            <Text style={sharedStyles.headerTitle}>{title}</Text>

            <View style={styles.headerInfo}>
                <Text style={styles.signedInText} numberOfLines={1}>
                    {userText}{roleText}
                </Text>
                <Text style={styles.selectedTableText}>
                    Table: {tableText}
                </Text>
            </View>
        </View>
        <OfflineHeaderBadge />
    </>
   );
}

const styles = StyleSheet.create({
    headerInfo: {
        marginLeft: 'auto',
        alignItems: 'flex-end',
        maxWidth: '45%',
    },
    signedInText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '800',
    },
    selectedTableText: {
        color: colors.warning,
        fontSize: 12,
        fontWeight: '800',
        marginTop: 2,
    },
})
