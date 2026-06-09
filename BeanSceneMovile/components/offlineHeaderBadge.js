import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CACHE_KEYS, getCache } from './cache.js';
import { colors } from '../styles.js';

/**
 * Displays a full-width offline banner when the app is using saved local data.
 *
 * @returns {?React.ReactElement} Offline badge or null when online.
 */
export default function OfflineHeaderBadge() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        loadOfflineState();

        const interval = setInterval(loadOfflineState, 500);

        return () => clearInterval(interval);
    }, []);

    /**
     * Reads the shared offline flag from local cache.
     *
     * @returns {Promise<void>} Resolves after local offline state is updated.
     */
    async function loadOfflineState() {
        const offlineMode = await getCache(CACHE_KEYS.offlineMode, false);

        setIsOffline(offlineMode === true);
    }

    if (!isOffline) return null;

    return (
        <View style={styles.badge}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.white} />
            <Text style={styles.text}>Offline mode: showing saved data. Changes will sync when connected.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        backgroundColor: colors.warning || '#F2BE2C',
        paddingHorizontal: 14,
        paddingVertical: 9,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
    },
    text: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
    },
});
