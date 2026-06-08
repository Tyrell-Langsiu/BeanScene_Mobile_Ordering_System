import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { colors, styles as sharedStyles} from '../styles.js';

export default function ManagerScreen({ navigation, onLogout, user }) {
    const isManager = user?.role === 'manager';

    async function handleLogout() {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out? ',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                        await AsyncStorage.removeItem('selectedTable');
                        await AsyncStorage.removeItem('beanSceneCart');

                        if (onLogout) {
                            onLogout();
                        }
                    },
                },
            ]
        );
    }

    function goToViewUsers() {
        navigation.navigate('StaffMembers');
    }
    function goToManageMenu() {
        navigation.navigate('ManageMenu');
    }
    function goToReports() {
       navigation.navigate('Reports');
    }

    return (
        <View style={sharedStyles.screen}>
            <View style={sharedStyles.header}>
                <Text style={sharedStyles.headerTitle}>Manage</Text>
            </View>

            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={handleLogout}
                    activeOpacity={0.85}>
                        <View style={styles.iconBox}>
                            <Ionicons name="log-out-outline" size={24} color={colors.white} />
                        </View>

                        <View style={styles.optionTextBox}>
                            <Text style={styles.optionTitle}>Log Out</Text>
                            <Text style={styles.optionSubtitle}>Sign out of the staff account</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color="#7D9AA0" />
                    </TouchableOpacity>
                
                {isManager && (
                    <>
                        <Text style={styles.sectionTitle}>Manager Options</Text>
                        <TouchableOpacity
                            style={styles.optionCard}
                            onPress={goToViewUsers}
                            activeOpacity={0.85}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="people-outline" size={24} color={colors.white} />
                                </View>

                                <View style={styles.optionTextBox}>
                                    <Text style={styles.optionTitle}>View Users</Text>
                                    <Text style={styles.optionSubtitle}>View and manage staff accounts</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={22} color="#7D9AA0" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={goToManageMenu}
                                activeOpacity={0.85}
                            >
                                <View style={styles.iconBox}>
                                    <Ionicons name="restaurant-outline" size={24} color={colors.white} />
                                </View>

                                <View style={styles.optionTextBox}>
                                    <Text style={styles.optionTitle}>Manage Menu</Text>
                                    <Text style={styles.optionSubtitle}>Add, edit, or remove menu items</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={22} color="#7D9AA0" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={goToReports}
                                activeOpacity={0.85}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="bar-chart-outline" size={24} color={colors.white} />
                                    </View>

                                    <View style={styles.optionTextBox}>
                                        <Text style={styles.optionTitle}>View Reports</Text>
                                        <Text style={styles.optionSubtitle}>View order activity and summaries</Text>
                                    </View>

                                    <Ionicons name="chevron-forward" size={22} color="#7D9AA0" />
                                </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 18,
    },
    optionCard: {
        backgroundColor: colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDE3E6',
        padding: 16,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowRadius: 4,
        elevation: 2,

    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    optionTextBox: {
        flex: 1,
    },
    optionTitle: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 3,
    },
    optionSubtitle: {
        color: '#62777B',
        fontSize: 13,
        fontWeight: '500',
    },
});
