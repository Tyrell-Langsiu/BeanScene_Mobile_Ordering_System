import React, { useEffect, useState} from 'react';
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

import { colors, styles as sharedStyles } from '../../styles';
import { apiFetch } from '../../components/apiFetch';
import { sortWithDataStructures } from '../../components/sort';

const STAFF_ENDPOINT = '/api/staff';

/**
 * Lists staff accounts and provides manager actions for add, edit, delete, and sort.
 *
 * @param {object} props Screen props.
 * @param {object} props.navigation React Navigation object.
 * @returns {React.ReactElement} Staff management screen.
 */
export default function StaffMemberScreen({ navigation }) {
    const [staffMembers, setStaffMembers] = useState([]);
    const [sortBy, setSortBy] = useState('sortName');
    const [sortDirection, setSortDirection] = useState('asc');
    const [loading, setLoading] = useState(true);

    const {width} = useWindowDimensions();
    const isTablet = width >= 700;

    useEffect(() => {
        loadStaffMembers();
    }, []);

    /**
     * Loads staff and manager accounts from the backend for management.
     *
     * @returns {Promise<void>} Resolves after staff state has been refreshed.
     */
    async function loadStaffMembers() {
        try {
            setLoading(true);

            const data = await apiFetch(STAFF_ENDPOINT);

            const staffOnly = data.filter(user => 
                user.role === 'Staff' ||
                user.role === 'Manager' ||
                user.role === 'staff' ||
                user.role === 'manager'
            );

            setStaffMembers(staffOnly.map(user => addStaffSortFields(user)));
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }
    /**
     * Resolves a staff member's display name from possible backend fields.
     *
     * @param {object} user Staff account record.
     * @returns {string} Display name.
     */
    function getName(user) {
        return (
            user.fullName ||
            `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            user.name ||
            'Staff Member'
        );
    }
    /**
     * Builds avatar initials from a staff member's display name.
     *
     * @param {object} user Staff account record.
     * @returns {string} Initials for the avatar.
     */
    function getInitials(user) {
        const name = getName(user);
        const parts = name.trim().split(' ');

        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }

        return name.substring(0, 2).toUpperCase();
    }
    /**
     * Resolves the staff member's role label.
     *
     * @param {object} user Staff account record.
     * @returns {string} Role label.
     */
    function getRole(user) {
        return user.role || 'Staff';
    }
    /**
     * Resolves the active/inactive status from backend status fields.
     *
     * @param {object} user Staff account record.
     * @returns {string} Status label.
     */
    function getStatus(user) {
        if (user.status) return user.status;
        if (user.active === false) return 'Inactive';
        if (user.isActive === false) return 'Inactive';
        return 'Active';
    }
    /**
     * Adds normalized fields used by the custom data-structure sorter.
     *
     * @param {object} user Staff account record.
     * @returns {object} Staff account with sort helper fields.
     */
    function addStaffSortFields(user) {
        return {
            ...user,
            sortName: getName(user),
            sortRole: getRole(user),
            sortStatus: getStatus(user),
        };
    }
    const sortedStaffMembers = sortWithDataStructures(staffMembers, sortBy, sortDirection);
    const sortOptions = [
        { label: 'Name', value: 'sortName' },
        { label: 'Role', value: 'sortRole' },
        { label: 'Status', value: 'sortStatus' },
    ];

    /**
     * Changes the staff sort field or toggles direction for the active field.
     *
     * @param {string} value Sort field key.
     * @returns {void}
     */
    function chooseSort(value) {
        if (sortBy === value) {
            setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
            return;
        }

        setSortBy(value);
        setSortDirection('asc');
    }
    /**
     * Opens the add-staff form.
     *
     * @returns {void}
     */
    function goToAddStaff() {
       navigation.navigate('AddStaff');
    }
    /**
     * Opens the edit-staff form for the selected account.
     *
     * @param {object} user Staff account record.
     * @returns {void}
     */
    function goToEditStaff(user) {
        navigation.navigate('EditStaff', { staff: user });
    }
    /**
     * Confirms and deletes a staff account from the backend.
     *
     * @param {object} user Staff account record.
     * @returns {Promise<void>} Resolves after the confirmation flow is created.
     */
    async function deleteStaff(user) {
        Alert.alert(
            'Delete Staff Member',
            `Are you sure you want to delete ${getName(user)}?`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiFetch(`${STAFF_ENDPOINT}/${user.id}`, {
                                method: 'DELETE',
                            });

                            setStaffMembers(current => 
                                current.filter(item => item.id !== user.id)
                            );

                            Alert.alert('Success', 'Staff member deleted.');
                        } catch (err) {
                            console.log(err);
                            Alert.alert('Error', err.message); 
                        }
                    },
                },
            ]
        );
    }
    /**
     * Renders a role or status badge with matching colour treatment.
     *
     * @param {string} text Badge text.
     * @param {'role'|'status'} type Badge type.
     * @returns {React.ReactElement} Badge component.
     */
    function renderBadge(text, type) {
        const isManager = text === 'Manager';
        const isActive = text === 'Active';

        return (
            <View
                style={[
                    styles.badge,
                    type === 'role' && (isManager ? styles.managerBadge : styles.staffBadge),
                    type === 'status' && (isActive ? styles.activeBadge : styles.inactiveBadge),

                ]}>
                    <Text
                        style={[
                            styles.badgeText,
                            type === 'role' && (isManager ? styles.managerText : styles.staffText),
                            type === 'status' && (isActive ? styles.activeText : styles.inactiveText),

                        ]}>
                            {text}
                    </Text>
            </View>
        );
    }
    /**
     * Renders one staff member card for phone layouts.
     *
     * @param {object} user Staff account record.
     * @returns {React.ReactElement} Staff card.
     */
    function renderMobileCard(user) {
        const name = getName(user);
        const role = getRole(user);
        const status = getStatus(user);

        return (
            <View key={user.id} style={styles.staffCard}>
                <View style={styles.cardTopRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user)}</Text>
                    </View>

                    <View style={styles.cardDetails}>
                        <Text style={styles.staffName}>{name}</Text>
                        <Text style={styles.staffEmail}>{user.email}</Text>
                    </View>
                </View>
                <View style={styles.cardBottomRow}>
                    <View style={styles.badgeRow}>
                        {renderBadge(role, 'role')}
                        {renderBadge(status, 'status')}
                    </View>
                    <View style={styles.actionRow}>
                        <TouchableOpacity onPress={() => goToEditStaff(user)}>
                            <Ionicons name="create-outline" size={20} color={colors.secondary || '#4AA6B8'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteStaff(user)}>
                            <Ionicons name="trash-outline" size={20} color="#FF5B6B" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
    
    /**
     * Renders the staff table used on tablet layouts.
     *
     * @returns {React.ReactElement} Staff table.
     */
    function renderTabletTable() {
        return (
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                    <Text style={[styles.tableHeaderText, styles.emailColumn]}>Email</Text>
                    <Text style={[styles.tableHeaderText, styles.phoneColumn]}>Phone</Text>
                    <Text style={[styles.tableHeaderText, styles.roleColumn]}>Role</Text>
                    <Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
                    <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Actions</Text>
                </View>
                {sortedStaffMembers.map(user => {
                    const name = getName(user);
                    const role = getRole(user);
                    const status = getStatus(user);

                    return (
                        <View key={user.id} style={styles.tableRow}>
                            <View style={[styles.nameCell, styles.nameColumn]}>
                                <View style={styles.smallAvatar}>
                                    <Text style={styles.smallAvatarText}>{getInitials(user)}</Text>

                                </View>

                                <Text numberOfLines={1} style={styles.tableText}>
                                    {name}
                                </Text>
                            </View>
                            <Text numberOfLines={1} style={[styles.tableText, styles.emailColumn]}>
                                {user.email}
                            </Text>
                            <Text numberOfLines={1} style={[styles.tableText, styles.phoneColumn]}>
                                {user.phone || 'N/A'}
                            </Text>
                            <View style={styles.roleColumn}>
                                {renderBadge(role, 'role')}
                            </View>
                            <View style={styles.statusColumn}>
                                {renderBadge(status, 'status')}
                            </View>
                            <View style={[styles.tableActions, styles.actionsColumn]}>
                                <TouchableOpacity onPress={() => goToEditStaff(user)}>
                                    <Ionicons name="create-outline" size={18} color={colors.secondary || '#4AA6B8'} /> 
                                </TouchableOpacity> 

                                <TouchableOpacity onPress={() => deleteStaff(user)}>
                                    <Ionicons name="trash-outline" size={18} color='#FF5B8B' />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    }
    if (loading) {
        return (
            <View style={sharedStyles.centeredContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading staff members...</Text>
            </View>
        );
    }
    return (
        <View style={sharedStyles.screen}>
            <View style={sharedStyles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={26} color={colors.white} />
                    </TouchableOpacity>
                <Text style={sharedStyles.headerTitle}>
                    Staff Members
                </Text>
            </View>
            <TouchableOpacity
                style={isTablet ? styles.addStaffButton : styles.addCircleButton}
                onPress={goToAddStaff}>
                    <Ionicons name='add' size={22} color={colors.primary} />
                    {isTablet && <Text style={styles.addStaffText}>Add Staff</Text>}
                </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sortRow}>
                    {sortOptions.map(option => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.sortButton,
                                sortBy === option.value && styles.sortButtonActive,
                            ]}
                            onPress={() => chooseSort(option.value)}
                            activeOpacity={0.85}>
                            <Text
                                style={[
                                    styles.sortButtonText,
                                    sortBy === option.value && styles.sortButtonTextActive,
                                ]}>
                                {option.label}
                            </Text>
                            {sortBy === option.value && (
                                <Ionicons
                                    name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                                    size={14}
                                    color={colors.white}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                {isTablet ? renderTabletTable() : sortedStaffMembers.map(user => renderMobileCard(user))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingBottom: 30,
    },

    loadingText: {
        marginTop: 10,
        color: colors.text || '#333',
    },

    addCircleButton: {
        position: 'absolute',
        top: 42,
        right: 20,
        zIndex: 5,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.warning || '#FFD23F',
        alignItems: 'center',
        justifyContent: 'center',
    },

    addStaffButton: {
        position: 'absolute',
        top: 34,
        right: 20,
        zIndex: 5,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning || '#FFD23F',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 6,
    },

    addStaffText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
    sortRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    sortButton: {
        minHeight: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDE5E7',
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F7FAFA',
    },
    sortButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sortButtonText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    sortButtonTextActive: {
        color: colors.white,
    },

    staffCard: {
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 2,
    },

    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4aa6b8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    avatarText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },

    cardDetails: {
        flex: 1,
    },

    staffName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },

    staffEmail: {
        fontSize: 13,
        color: '#41636b',
        marginTop: 3,
    },

    cardBottomRow: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    badgeRow: {
        flexDirection: 'row',
        gap: 8,
    },

    actionRow: {
        flexDirection: 'row',
        gap: 16,
    },

    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        alignSelf: 'flex-start',
    },

    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },

    managerBadge: {
        backgroundColor: '#FFF2BF',
    },

    staffBadge: {
        backgroundColor: '#DCEFF3',
    },

    activeBadge: {
        backgroundColor: '#DDF8E6',
    },

    inactiveBadge: {
        backgroundColor: '#FFE0E7',
    },

    managerText: {
        color: '#C79400',
    },

    staffText: {
        color: '#3C8796',
    },

    activeText: {
        color: '#17A05D',
    },

    inactiveText: {
        color: '#D83255',
    },

    table: {
        backgroundColor: colors.white,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },

    tableHeader: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 14,
    },

    tableHeaderText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
    },

    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minHeight: 70,
    },

    tableText: {
        fontSize: 13,
        color: '#24464d',
    },

    nameCell: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    smallAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4aa6b8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    smallAvatarText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 12,
    },

    tableActions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },

    nameColumn: {
        flex: 1.3,
    },

    emailColumn: {
        flex: 1.6,
    },

    phoneColumn: {
        flex: 1.1,
    },

    roleColumn: {
        flex: 0.9,
    },

    statusColumn: {
        flex: 0.9,
    },

    actionsColumn: {
        flex: 0.7,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    }
});
