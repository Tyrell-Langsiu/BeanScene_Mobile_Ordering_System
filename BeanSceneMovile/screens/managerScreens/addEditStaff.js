import React, {useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView, 
    TextInput,
    TouchableOpacity,
    Alert,
    Switch,
    useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, styles as sharedStyles } from  '../../styles.js';
import { apiFetch } from '../../components/apiFetch.js';

const STAFF_ENDPOINT = '/api/staff';

export default function AddEditStaffScreen({ navigation, route }) {
    const editingStaff = route.params?.staff || null;
    const isEditing = !!editingStaff;

    const {width} = useWindowDimensions();
    const isTablet = width >= 700;

    const existingName = editingStaff?.fullName || `${editingStaff?.firstName || ''} ${editingStaff?.lastName || ''}`.trim();

    const [fullName, setFullName] = useState(existingName || '');
    const [email, setEmail] = useState(editingStaff?.email || '');
    const [phone, setPhone] = useState(editingStaff?.phone || '');
    const [role, setRole] = useState(editingStaff?.role || 'staff');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isActive, setIsActive] = useState(editingStaff?.isActive ?? true);
    const [saving, setSaving] = useState(false);

    const headerTitle = isEditing ? getDisplayName(editingStaff) : 'Add Staff Member';
    
    function getDisplayName(staff) {
        return (
            staff?.fullName ||
            `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim() ||
            'Edit Staff Member'
        );
    }
    function splitFullName() {
        const parts = fullName.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        return { firstName, lastName };
    }

    async function handleSave() {
        const { firstName, lastName } = splitFullName();

        if (!firstName || !lastName) {
            Alert.alert('Validation Error', 'Please enter a full name with first and last name.');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Validation Error', 'Please enter a valid email address.');
            return;
        }

        if (!isEditing) {
            if (password.length < 8) {
                Alert.alert('Validation Error', 'Password must be at least 8 characters.');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Validation Error', 'Passwords do not match.');
                return;
            }
        }
        try {
            setSaving(true);

            const payload = {
                firstName,
                lastName,
                email,
                phone,
                role: role.toLowerCase(),
                isActive,
            };
            if (!isEditing) {
                payload.password = password;
            }
            if (isEditing) {
                await apiFetch(`${STAFF_ENDPOINT}/${editingStaff.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });

                Alert.alert('Success', 'Staff member updated.', [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            } else {
                await apiFetch(STAFF_ENDPOINT, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });

                Alert.alert('Success', 'Staff member created', [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]);
            }
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <View style={sharedStyles.screen}>
            <View style={sharedStyles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={26} color={colors.white} />
                    </TouchableOpacity>
                <Text style={sharedStyles.headerTitle}>{headerTitle}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.formCard, isTablet && styles.tabletFormCard]}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter full Name"
                            placeholderTextColor="#8AA1A6" />
                    </View>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="staff@beanscene.com"
                            placeholderTextColor={"#8AA1A6"}
                            autoCapitalize="none"
                            keyboardType="email-address" />
                    </View>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="04000 000 000"
                            placeholderTextColor={"#8AA1A6"}
                            keyboardType='phone-pad' />
                    </View>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Role</Text>

                        <TouchableOpacity
                            style={styles.roleSelect}
                            onPress={() => {
                                setRole(role.toLowerCase() === 'staff' ? 'manager' : 'staff');
                            }}>
                                <Text style={styles.roleText}>
                                    {role.toLowerCase() === 'manager' ? 'Manager' : 'Staff'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.primary} />
                            </TouchableOpacity>
                    </View>

                    {!isEditing && (
                        <>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter password"
                                    placeholderTextColor={"#8AA1A6"}
                                    secureTextEntry 
                                    />
                            </View>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder='Confirm password'
                                    placeholderTextColor={"#8AA1A6"}
                                    secureTextEntry
                                />
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.divider} />
                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.label}>Active Status</Text>
                        <Text style={styles.helperText}>Allow this user to log in to the system</Text>    
                    </View>

                    <Switch
                        value={isActive}
                        onValueChange={setIsActive}
                        trackColor={{false: '#D7DEE0', true: '#8BE3A8'}}
                        thumbColor={isActive ? '#00C853' : '#F4F3F4'}
                        />   
                </View>
                <View style={styles.bottomDivider} />

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}>
                            <Text style={styles.saveText}>
                                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Staff Member'}
                            </Text>
                        </TouchableOpacity>
                </View>

                
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

    formCard: {
        backgroundColor: colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        padding: 18,
    },

    tabletFormCard: {
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
        padding: 28,
    },

    tabletGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 24,
        justifyContent: 'space-between',
    },

    fieldGroup: {
        marginBottom: 16,
        width: '100%',
    },

    label: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },

    input: {
        borderWidth: 1,
        borderColor: '#D8E0E3',
        borderRadius: 8,
        paddingHorizontal: 14,
        height: 48,
        color: colors.primary,
        backgroundColor: '#FBFCFC',
    },

    roleSelect: {
        borderWidth: 1,
        borderColor: '#D8E0E3',
        borderRadius: 8,
        paddingHorizontal: 14,
        height: 48,
        backgroundColor: '#FBFCFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    roleText: {
        color: colors.primary,
        fontWeight: '700',
    },

    divider: {
        height: 1,
        backgroundColor: '#E1E6E8',
        marginTop: 4,
        marginBottom: 18,
    },

    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },

    helperText: {
        color: colors.primary,
        fontSize: 12,
    },

    bottomDivider: {
        height: 1,
        backgroundColor: '#E1E6E8',
        marginTop: 28,
        marginBottom: 20,
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },

    cancelButton: {
        borderWidth: 1,
        borderColor: '#D8E0E3',
        borderRadius: 8,
        paddingHorizontal: 22,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cancelText: {
        color: colors.primary,
        fontWeight: '700',
    },

    saveButton: {
        backgroundColor: colors.accent,
        borderRadius: 8,
        paddingHorizontal: 22,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },

    saveText: {
        color: colors.white,
        fontWeight: '800',
    },
});
