import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    Switch,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, styles as sharedStyles } from '../../styles.js';
import { apiFetch } from '../../components/apiFetch.js';

const CATEGORIES_ENDPOINT = '/api/categories';

/**
 * Creates or edits a menu category used for browsing and manager filtering.
 *
 * @param {object} props Screen props.
 * @param {object} props.navigation React Navigation object.
 * @param {object} props.route Route params containing an optional category record.
 * @returns {React.ReactElement} Category add/edit form.
 */
export default function AddEditCategoryScreen({ navigation, route }) {
    const editingCategory = route.params?.category || null;
    const isEditing = !!editingCategory;

    const { width } = useWindowDimensions();
    const isTablet = width >= 700;

    const [name, setName] = useState(editingCategory?.name || editingCategory?.categoryName || '');
    const [description, setDescription] = useState(editingCategory?.description || '');
    const [displayOrder, setDisplayOrder] = useState(
        editingCategory?.displayOrder !== undefined ? String(editingCategory.displayOrder) : '0'
    );
    const [isActive, setIsActive] = useState(editingCategory?.isActive ?? true);
    const [saving, setSaving] = useState(false);

    const headerTitle = isEditing ? 'Edit Category' : 'Add Category';

    /**
     * Resolves a category ID from possible backend field names.
     *
     * @param {object} category Category record.
     * @returns {string|number|undefined} Category identifier.
     */
    function getCategoryId(category) {
        return category?.id || category?._id;
    }

    /**
     * Validates the category form before saving.
     *
     * @returns {boolean} True when the form can be submitted.
     */
    function validateForm() {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Category name is required.');
            return false;
        }

        if (displayOrder !== '' && Number.isNaN(Number(displayOrder))) {
            Alert.alert('Validation Error', 'Display order must be a number.');
            return false;
        }

        return true;
    }

    /**
     * Creates or updates a category and returns to menu management.
     *
     * @returns {Promise<void>} Resolves after the save attempt completes.
     */
    async function handleSave() {
        if (!validateForm()) return;

        try {
            setSaving(true);

            const payload = {
                name: name.trim(),
                description: description.trim(),
                displayOrder: Number(displayOrder || 0),
                isActive,
            };

            if (isEditing) {
                await apiFetch(`${CATEGORIES_ENDPOINT}/${getCategoryId(editingCategory)}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });

                Alert.alert('Success', 'Category updated.');
                navigation.navigate('ManageMenu');
            } else {
                await apiFetch(CATEGORIES_ENDPOINT, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });

                Alert.alert('Success', 'Category created.');
                navigation.navigate('ManageMenu');
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
                    activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={26} color={colors.white} />
                </TouchableOpacity>
                <Text style={sharedStyles.headerTitle}>{headerTitle}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.formCard, isTablet && styles.tabletFormCard]}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Category Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter category name"
                            placeholderTextColor="#8AA1A6"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.descriptionInput]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter category description"
                            placeholderTextColor="#8AA1A6"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Display Order</Text>
                        <TextInput
                            style={styles.input}
                            value={displayOrder}
                            onChangeText={setDisplayOrder}
                            placeholder="0"
                            placeholderTextColor="#8AA1A6"
                            keyboardType="number-pad"
                        />
                    </View>

                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.label}>Active Status</Text>
                            <Text style={styles.helperText}>Show this category in the menu</Text>
                        </View>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: '#D7DEE0', true: '#8BE3A8' }}
                            thumbColor={isActive ? '#00C853' : '#F4F3F4'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={saving}>
                            <Text style={styles.saveText}>
                                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Category'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        padding: 16,
    },
    tabletFormCard: {
        maxWidth: 720,
        width: '100%',
        alignSelf: 'center',
        padding: 28,
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D8E0E3',
        borderRadius: 8,
        paddingHorizontal: 14,
        backgroundColor: '#FBFCFC',
        color: colors.primary,
    },
    descriptionInput: {
        height: 90,
        paddingTop: 12,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    helperText: {
        color: '#62777B',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E1E6E8',
        marginTop: 22,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    cancelButton: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D8E0E3',
        borderRadius: 8,
        paddingHorizontal: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        color: colors.primary,
        fontWeight: '700',
    },
    saveButton: {
        height: 48,
        backgroundColor: colors.accent,
        borderRadius: 8,
        paddingHorizontal: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveText: {
        color: colors.white,
        fontWeight: '800',
    },
});
