import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    useWindowDimensions,
    Switch,
    Image,
    Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {colors, styles as sharedStyles} from '../../styles.js';
import { apiFetch, API_BASE_URL } from '../../components/apiFetch.js';


const MENU_ENDPOINT = '/api/menu-items';
const CATEGORIES_ENDPOINT = '/api/categories';

export default function AddEditMenuScreen({ navigation, route }) {
    const editingItem = route.params?.item || null;
    const isEditing = !!editingItem;

    const {width} = useWindowDimensions();
    const isTablet = width >= 700;

    const [categories, setCategories] = useState([]);
    const [name, setName] = useState(editingItem?.name || editingItem?.itemName || '');
    const [description, setDescription] = useState(editingItem?.description || '');
    const [price, setPrice] = useState(
        editingItem?.price !== undefined ? String(editingItem.price) : ''
    );
    const [category, setCategory] = useState(
        getStartingCategory(editingItem)
    );
    const [isAvailable, setIsAvailable] = useState(
        editingItem?.isAvailable ?? editingItem?.available ?? true
    );
    const [dietaryFlags, setDietaryFlags] = useState(
        normalizeDietaryFlags(editingItem?.dietaryFlags || editingItem?.flags || [])
    );
    const [imageUri, setImageUri] = useState(
        getImageUrl(editingItem)
    );
    const [imageAsset, setImageAsset] = useState(null);
    const [saving, setSaving] = useState(false);

    const headerTitle = isEditing
        ? name || 'Edit Menu Item'
        : 'Add Menu Item';

    useEffect(() => {
        loadCategories();
    }, []);

    function getStartingCategory(item) {
        if (!item) return 'Entrees';

        if (item.categoryId) return item.categoryId;
        if (typeof item.category === 'string') return item.category;
        if (item.category?.name) return item.category.name;
        if (item.categoryName) return item.categoryName;

        return 'Entrees';
    }
    function getImageUrl(item) {
        if (!item) return '';

        const image = item.photoUrl || item.imageUrl || item.photo || item.image || item.imageUri;

        if (!image) return '';

        const imageString = String(image);

        if (imageString.startsWith('http') || imageString.startsWith('file:') || imageString.startsWith('data:')) {
            return imageString;
        }

        return `${API_BASE_URL}${imageString}`;
    }
    function normalizeDietaryFlags(flags) {
        const flagMap = {
            vegetarian: 'V',
            vegan: 'VG',
            glutenFree: 'GF',
            glutenfree: 'GF',
        };

        if (Array.isArray(flags)) {
            return flags.map(flag => flagMap[String(flag)] || flag);
        }
        if (typeof flags === 'string') {
            return flags ? [flagMap[flags] || flags] : [];
        }
        if (typeof flags === 'object' && flags !== null) {
            return Object.entries(flags)
                .filter(([, value]) => value === true)
                .map(([key]) => flagMap[key] || key);
        }

        return [];
    }
    function getCategoryId(cat) {
        return cat?.id || cat?._id;
    }
    function getCategoryLabel(cat) {
        return cat?.name || cat?.categoryName || getCategoryId(cat);
    }
    function getSelectedCategory() {
        return categories.find(cat => {
            const id = getCategoryId(cat);
            const label = getCategoryLabel(cat);

            return id === category || label === category;
        });
    }
    function buildDietaryFlagsObject(flags) {
        const normalizedFlags = normalizeDietaryFlags(flags);

        return {
            vegetarian: normalizedFlags.includes('V') || normalizedFlags.includes('vegetarian'),
            vegan: normalizedFlags.includes('VG') || normalizedFlags.includes('vegan'),
            glutenFree: normalizedFlags.includes('GF') || normalizedFlags.includes('glutenFree'),
        };
    }
    function getImageFileName() {
        if (!imageAsset?.uri) {
            return null;
        }

        const cleanUri = imageAsset.uri.split('?')[0];

        return (
            imageAsset.fileName ||
            cleanUri.split('/').pop() ||
            `menu-item-${Date.now()}.jpg`
        );
    }
    function getImageMimeType(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();

        return imageAsset.mimeType || (extension === 'png'
            ? 'image/png'
            : extension === 'webp'
                ? 'image/webp'
                : 'image/jpeg');
    }
    async function appendImageToFormData(formData) {
        if (!imageAsset?.uri) {
            return false;
        }

        if (Platform.OS === 'web') {
            const fileName = getImageFileName();
            const response = await fetch(imageAsset.uri);
            const blob = await response.blob();

            formData.append('photo', blob, fileName);
            return true;
        }

        const fileName = getImageFileName();
        const mimeType = getImageMimeType(fileName);
        const photoUrl = imageAsset.base64
            ? `data:${mimeType};base64,${imageAsset.base64}`
            : imageAsset.uri;

        formData.append('photoUrl', photoUrl);
        return true;
    }
    async function buildMenuFormData() {
        const selectedCategory = getSelectedCategory();
        const selectedCategoryId = getCategoryId(selectedCategory) || category;
        const selectedCategoryName = getCategoryLabel(selectedCategory) || category;
        const formData = new FormData();

        formData.append('name', name.trim());
        formData.append('description', description.trim());
        formData.append('price', String(Number(price)));
        formData.append('categoryId', String(selectedCategoryId));
        formData.append('categoryName', String(selectedCategoryName));
        formData.append('dietaryFlags', JSON.stringify(buildDietaryFlagsObject(dietaryFlags)));
        formData.append('ingredients', JSON.stringify([]));
        formData.append('allergens', JSON.stringify([]));
        formData.append('isAvailable', String(isAvailable));
        formData.append('isSpecial', 'false');

        const imageWasAppended = await appendImageToFormData(formData);

        if (!imageWasAppended && imageUri) {
            formData.append('photoUrl', imageUri.replace(API_BASE_URL, ''));
        }

        return formData;
    }
    async function loadCategories() {
        try {
            const data = await apiFetch(CATEGORIES_ENDPOINT);

            const categoryList = Array.isArray(data)
                ? data
                : data.categories || [];
            
            setCategories(categoryList);

            if (!isEditing && categoryList.length > 0) {
                setCategory(getCategoryId(categoryList[0]) || getCategoryLabel(categoryList[0]));
            }
        } catch (err) {
            console.log(err);
        }
    }
    function getItemId(item) {
        return item.id || item._id || item.itemId || item.menuItemId;
    }
    function getCategoryNames() {
        const names = categories
            .map(getCategoryLabel)
            .filter(Boolean);

        if (names.length === 0) {
            return ['Entrees', 'Mains', 'Desserts', 'Drinks', 'Sides', 'Specials'];
        }
        return names;
    }
    function changeCategory() {
        const options = categories.length > 0
            ? categories.map(cat => getCategoryId(cat) || getCategoryLabel(cat)).filter(Boolean)
            : getCategoryNames();
        const currentIndex = options.indexOf(category);
        const nextIndex = currentIndex === -1 || currentIndex === options.length -1
            ? 0
            : currentIndex + 1;
        
        setCategory(options[nextIndex]);
    }
    function getCategoryDisplayText() {
        const selectedCategory = getSelectedCategory();

        return getCategoryLabel(selectedCategory) || category;
    }

    function toggleFlag(flag) {
        setDietaryFlags(current => {
            const currentFlags = normalizeDietaryFlags(current);

            if (currentFlags.includes(flag)) {
                return currentFlags.filter(item => item !== flag);
            }

            return [...currentFlags, flag];
        });
    }
    function validateForm() {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Item name is required.');
            return false;
        }
        if (!description.trim()) {
            Alert.alert('Validation Error', 'Description is required');
            return false;
        }
        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            Alert.alert('Validation Error', 'Enter a valid price.');
            return false;
        }
        if (!category) {
            Alert.alert('Validation Error', 'Category is required.');
            return false;
        }

        return true;
    }
    async function pickImage() {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.4,
                base64: Platform.OS !== 'web',
            });

            if (!result.canceled) {
                const selectedImage = result.assets[0];

                setImageUri(selectedImage.uri);
                setImageAsset(selectedImage);
            }
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Could not select image.');
        }
    }
    async function handleSave() {
        if (!validateForm()) return;

        try {
            setSaving(true);
            const payload = await buildMenuFormData();

            if (isEditing) {
                await apiFetch(`${MENU_ENDPOINT}/${getItemId(editingItem)}`, {
                    method: 'PUT',
                    body: payload,
                });

                Alert.alert('Success', 'Menu item updated.');
                navigation.navigate('ManageMenu');
            } else {
                await apiFetch(MENU_ENDPOINT, {
                    method: 'POST',
                    body: payload,
                });
                Alert.alert('Success', 'Menu item created.');
                navigation.navigate('ManageMenu');
            }
        } catch (err) {
            console.log(err);
            Alert.alert('Error', err.message);
        } finally {
            setSaving(false);
        }
    }
    function renderFlagCheckBox(flag, label) {
        const selected = normalizeDietaryFlags(dietaryFlags).includes(flag);

        return (
            <TouchableOpacity
                style={styles.flagOption}
                onPress={() => toggleFlag(flag)}
                activeOpacity={0.8}>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                        {selected && <Ionicons name="checkmark" size={12} color={colors.white} />}
                    </View>
                    <View style={[
                        styles.flagBadge,
                        flag === 'GF' && styles.gfBadge,
                        flag === 'V' && styles.vBadge,
                        flag === 'VG' && styles.vgBadge,
                    ]}>
                        <Text style={styles.flagText}>{flag}</Text>
                    </View>
                    <Text style={styles.flagLabel}>{label}</Text>
                </TouchableOpacity>
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
                    <Text style={sharedStyles.headerTitle}>{headerTitle}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.formCard, isTablet && styles.tabletFormCard]}>
                    <View style={isTablet ? styles.tabletLayout : null}>
                        <View style={isTablet ? styles.imageColumn : null}>
                            <Text style={styles.label}>Item Image</Text>

                            <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage}>
                               {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                               ) : (
                                <>
                                    <Ionicons name="image-outline" size={34} color={colors.primary} />
                                    <Text style={styles.uploadText}>
                                        {isTablet ? 'Click to upload' : 'Tap to upload'}
                                    </Text>
                                </>
                               )}
                            </TouchableOpacity>
                        </View>
                        <View style={isTablet ? styles.formColumn : null}>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Item Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter item name"
                                    placeholderTextColor="#8AA1A6" />
                            </View>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.descriptionInput]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Enter item description"
                                    placeholderTextColor="#8AA1A6"
                                    multiline
                                    textAlignVertical='top' />
                            </View>
                            <View style={styles.rowFields}>
                                <View style={[styles.fieldGroup, styles.halfField]}>
                                    <Text style={styles.label}>Price</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={price}
                                        onChangeText={setPrice}
                                        placeholder="$0.00"
                                        placeholderTextColor="#8AA1A6"
                                        keyboardType="decimal-pad" />
                                </View>
                                <View style={[styles.fieldGroup, styles.halfField]}>
                                    <Text style={styles.label}>Category</Text>

                                    <TouchableOpacity
                                        style={styles.categorySelect}
                                        onPress={changeCategory}>
                                            <Text style={styles.categoryText}>{getCategoryDisplayText()}</Text>
                                            <Ionicons name="chevron-down" size={20} color={colors.primary} />
                                        </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Dietary Flags</Text>
                                <View style={styles.flagsWrap}>
                                    {renderFlagCheckBox('V', 'Vegetarian')}
                                    {renderFlagCheckBox('VG', 'Vegan')}
                                    {renderFlagCheckBox('GF', 'Gluten Free')}
                                </View>
                            </View>
                            {isEditing && (
                                <View style={styles.activeRow}>
                                    <View>
                                        <Text style={styles.label}>Available Status</Text>
                                        <Text style={styles.helperText}>Allow this item to be ordered</Text>
                                    </View>

                                    <Switch
                                        value={isAvailable}
                                        onValueChange={setIsAvailable}
                                        trackColor={{ false: '#D7DEE0', true: '#8BE3A8'}}
                                        thumbColor={isAvailable ? '#00C853' : '#F4F3F4'} />
                                </View> 
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() =>  navigation.goBack()}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving}>
                                <Text style={styles.saveText}>
                                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Item'}
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
    tabletLayout: {
        flexDirection: 'row',
        gap: 28,
    },
    imageColumn: {
        width: 170,
    },
    formColumn: {
        flex: 1,
    },
    label: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    fieldGroup: {
        marginBottom: 16,
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
    imageUploadBox: {
        height: 120,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#D8E0E3',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FBFCFC',
    },
    uploadText: {
        color: colors.primary,
        fontWeight: '600',
        marginTop: 8,
    },
    rowFields: {
        flexDirection: 'row',
        gap: 12,
    },
    halfField: {
        flex: 1,
    },
    categorySelect: {
        height: 48,
        borderWidth: 1,
        borderColor: '#D8E0E3',
        borderRadius: 8,
        paddingHorizontal: 14,
        backgroundColor: '#FBFCFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    categoryText: {
        color: colors.primary,
        fontWeight: '700',
    },
    flagsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    flagOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 4,
        marginBottom: 8,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderWidth: 1,
        borderColor: '#AAB8BC',
        borderRadius: 2,
        marginRight: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#00C853',
        borderColor: '#00C853',
    },
    flagBadge: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginRight: 5,
    },
    vBadge: {
        backgroundColor: '#00C853',
    },
    vgBadge: {
        backgroundColor: '#00A878',
    },
    gfBadge: {
        backgroundColor: '#FF9800',
    },
    flagText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: '800',
    },
    flagLabel: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    activeRow: {
        marginTop: 4,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    helperText: {
        color: '#62777B',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E1E6E8',
        marginTop: 10,
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
    saveText: {
        color: colors.white,
        fontWeight: '800',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    }
});
