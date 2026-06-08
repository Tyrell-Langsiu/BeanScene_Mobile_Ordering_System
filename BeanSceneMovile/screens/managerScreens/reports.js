import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {colors, styles as sharedStyles} from '../../styles.js';
import { apiFetch } from '../../components/apiFetch.js';

const REPORTS_ENDPOINT = '/api/reports';
const ORDERS_SUMMARY_ENDPOINT = `${REPORTS_ENDPOINT}/orders-summary`;

/**
 * Displays order activity summary metrics for managers.
 *
 * @param {object} props Screen props.
 * @param {object} props.navigation React Navigation object.
 * @returns {React.ReactElement} Reports screen.
 */
export default function ReportsScreen({ navigation }) {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);

    const { width } = useWindowDimensions();
    const isTablet = width >= 700;

    useEffect(() => {
        loadReports();
    }, []);

    /**
     * Loads order summary report data from the backend.
     *
     * @returns {Promise<void>} Resolves after report state has been refreshed.
     */
    async function loadReports() {
        try {
            setLoading(true);

            const data = await apiFetch(ORDERS_SUMMARY_ENDPOINT);

            setReports({
                totalOrders: data.totalOrders ?? 0,
                inProgress: data.inProgress ?? 0,
                completed: data.completed ?? 0,
                totalRevenue: data.totalRevenue ?? 0,
            });
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message || 'Unable to load reports.');
        } finally {
            setLoading(false);
        }
    }
    /**
     * Formats a numeric value as currency for report cards.
     *
     * @param {number|string} value Revenue value.
     * @returns {string} Formatted currency.
     */
    function formatMoney(value) {
        return `$${Number(value || 0).toFixed(2)}`;
    }
    /**
     * Renders the reports header with back navigation.
     *
     * @returns {React.ReactElement} Header component.
     */
    function renderHeader() {
        return (
            <View style={sharedStyles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={colors.white} />
                    </TouchableOpacity>
                <Text style={sharedStyles.headerTitle}>
                    {isTablet ? 'Reports Dashboard' : 'Reports'}
                </Text>
            </View>
        );
    }
    /**
     * Renders one report metric card.
     *
     * @param {string} icon Ionicons icon name.
     * @param {string} title Metric title.
     * @param {string|number} value Metric value.
     * @param {string} note Supporting metric note.
     * @returns {React.ReactElement} Summary card.
     */
    function renderSummaryCard(icon, title, value, note) {
        return (
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons name={icon} size={18} color={colors.accent} />
                    <Text style={styles.summaryTitle}>{title}</Text>
                </View>
                <Text style={styles.summaryValue}>{value}</Text>

                {note ? <Text style={styles.summaryNote}>{note}</Text>: null}
            </View>
        );
    }
    /**
     * Renders the grid of top-level order summary metrics.
     *
     * @returns {?React.ReactElement} Summary cards or null before data loads.
     */
    function renderSummaryCards() {
        if (!reports) return null;

        return (
            <View style={styles.summaryGrid}>
                {renderSummaryCard(
                    'bar-chart-outline',
                    'Total Revenue',
                    formatMoney(reports.totalRevenue),
                    'Completed and in-progress orders'
                )}
                {renderSummaryCard(
                    'receipt-outline',
                    'Total Orders',
                    reports.totalOrders,
                    'All orders recorded'
                )}
                {renderSummaryCard(
                    'timer-outline',
                    'In Progress',
                    reports.inProgress,
                    'Orders still active'
                )}
                {renderSummaryCard(
                    'checkmark-circle-outline',
                    'Completed',
                    reports.completed,
                    'Orders marked served'
                )}
            </View>
        );
    }
    /**
     * Renders the in-progress versus completed order breakdown panel.
     *
     * @returns {?React.ReactElement} Status panel or null before data loads.
     */
    function renderStatusBreakdown() {
        if (!reports) return null;

        const totalOrders = Math.max(Number(reports.totalOrders || 0), 1);
        const inProgressPercent = Math.round((Number(reports.inProgress || 0) / totalOrders) * 100);
        const completedPercent = Math.round((Number(reports.completed || 0) / totalOrders) * 100);

        return (
            <View style={[styles.panel, isTablet && styles.largePanel]}>
                <Text style={styles.panelTitle}>
                    Order Status Breakdown
                </Text>
                {[
                    { label: 'In Progress', value: reports.inProgress, percentage: inProgressPercent },
                    { label: 'Completed', value: reports.completed, percentage: completedPercent },
                ].map(item => (
                    <View key={item.label} style={styles.categoryRow}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryName}>{item.label}</Text>
                            <Text style={styles.categoryPercent}>
                                {item.value} ({item.percentage}%)
                            </Text>
                        </View>

                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {width: `${Math.min(item.percentage, 100)}%`},
                                ]}
                                />
                        </View>
                    </View>
                ))}
            </View>
        );
    }
    /**
     * Renders the revenue summary panel.
     *
     * @returns {?React.ReactElement} Revenue panel or null before data loads.
     */
    function renderRevenuePanel() {
        if (!reports) return null;

        return (
            <View style={styles.panel}>
                <Text style={styles.panelTitle}>Revenue Summary</Text>
                <Text style={styles.revenueValue}>{formatMoney(reports.totalRevenue)}</Text>
                <Text style={styles.revenueNote}>
                    Total revenue is calculated by the backend from all orders.
                </Text>
            </View>
        );
    }
    if (loading) {
        return (
            <View style={sharedStyles.centeredContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
        );
    }
    return (
        <View style={sharedStyles.screen}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={loadReports}
                    activeOpacity={0.85}>
                        <Ionicons name="refresh-outline" size={18} color={colors.white} />
                        <Text style={styles.refreshText}>Refresh Reports</Text>
                    </TouchableOpacity>

                    {renderSummaryCards()}

                    {isTablet ? (
                        <View style={styles.tabletTwoColumn}>
                            {renderStatusBreakdown()}
                            {renderRevenuePanel()}
                        </View>
                    ) : (
                        <>
                            {renderStatusBreakdown()}
                            {renderRevenuePanel()}
                        </>
                    )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    backButton: {
        marginRight: 12,
        padding: 4,
    },

    content: {
        padding: 16,
        paddingBottom: 30,
    },

    loadingText: {
        marginTop: 10,
        color: colors.primary,
        fontWeight: '600',
    },

    refreshButton: {
        backgroundColor: colors.accent,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 14,
    },

    refreshText: {
        color: colors.white,
        fontWeight: '800',
    },

    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
    },

    summaryCard: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        borderRadius: 10,
        padding: 16,
        flexGrow: 1,
        flexBasis: '45%',
        minHeight: 92,
    },

    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },

    summaryTitle: {
        color: '#62777B',
        fontSize: 12,
        fontWeight: '700',
    },

    summaryValue: {
        color: colors.primary,
        fontSize: 22,
        fontWeight: '900',
    },

    summaryNote: {
        marginTop: 8,
        color: '#17A05D',
        fontSize: 11,
        fontWeight: '700',
    },

    tabletTwoColumn: {
        flexDirection: 'row',
        gap: 16,
    },

    panel: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        borderRadius: 10,
        padding: 16,
        marginBottom: 14,
    },

    largePanel: {
        flex: 1,
        minHeight: 250,
    },

    panelTitle: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
    },

    categoryRow: {
        marginBottom: 14,
    },

    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    categoryName: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },

    categoryPercent: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },

    progressTrack: {
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        backgroundColor: colors.accent,
        borderRadius: 6,
    },

    revenueValue: {
        color: colors.primary,
        fontSize: 28,
        fontWeight: '900',
    },

    revenueNote: {
        color: '#62777B',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
    },
});
