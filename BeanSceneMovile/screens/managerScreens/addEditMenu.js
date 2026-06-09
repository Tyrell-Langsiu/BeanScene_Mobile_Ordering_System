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
import { CACHE_KEYS, addToCacheQueue, getCache, setCache } from '../../components/cache.js';
import OfflineHeaderBadge from '../../components/offlineHeaderBadge.js';


const MENU_ENDPOINT = '/api/menu-items';
const CATEGORIES_ENDPOINT = '/api/categories';

/**
 * Creates or edits a menu item, including category, dietary flags, availability, and photo data.
 *
 * @param {object} props Screen props.
 * @param {object} props.navigation React Navigation object.
 * @param {object} props.route Route params containing an optional menu item.
 * @returns {React.ReactElement} Menu item add/edit form.
 */
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
        syncPendingMenuItems();
        loadCategories();
    }, []);

    /**
     * Determines the starting category value when editing an existing menu item.
     *
     * @param {?object} item Existing menu item.
     * @returns {string} Category ID or label.
     */
    function getStartingCategory(item) {
        if (!item) return 'Entrees';

        if (item.categoryId) return item.categoryId;
        if (typeof item.category === 'string') return item.category;
        if (item.category?.name) return item.category.name;
        if (item.categoryName) return item.categoryName;

        return 'Entrees';
    }
    /**
     * Converts stored image fields into a renderable URI for the preview.
     *
     * @param {?object} item Existing menu item.
     * @returns {string} Renderable image URI or an empty string.
     */
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
    /**
     * Converts dietary flag input into the short flag codes used by the UI.
     *
     * @param {string|string[]|object} flags Dietary flags from state or backend.
     * @returns {string[]} Normalized flag codes.
     */
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
    /**
     * Resolves a category ID from backend category fields.
     *
     * @param {object} cat Category record.
     * @returns {string|number|undefined} Category identifier.
     */
    function getCategoryId(cat) {
        return cat?.id || cat?._id;
    }
    /**
     * Resolves the category label displayed to the manager.
     *
     * @param {object} cat Category record.
     * @returns {string|number|undefined} Category label.
     */
    function getCategoryLabel(cat) {
        return cat?.name || cat?.categoryName || getCategoryId(cat);
    }
    /**
     * Finds the category record matching the current category state.
     *
     * @returns {?object} Selected category record.
     */
    function getSelectedCategory() {
        return categories.find(cat => {
            const id = getCategoryId(cat);
            const label = getCategoryLabel(cat);

            return id === category || label === category;
        });
    }
    /**
     * Converts selected dietary flags into the backend object format.
     *
     * @param {string[]|object|string} flags Current dietary flag state.
     * @returns {{vegetarian: boolean, vegan: boolean, glutenFree: boolean}} Backend dietary flags.
     */
    function buildDietaryFlagsObject(flags) {
        const normalizedFlags = normalizeDietaryFlags(flags);

        return {
            vegetarian: normalizedFlags.includes('V') || normalizedFlags.includes('vegetarian'),
            vegan: normalizedFlags.includes('VG') || normalizedFlags.includes('vegan'),
            glutenFree: normalizedFlags.includes('GF') || normalizedFlags.includes('glutenFree'),
        };
    }
    /**
     * Builds a filename for the selected image asset.
     *
     * @returns {?string} Image filename or null when no image is selected.
     */
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
    /**
     * Determines the selected image MIME type from asset metadata or file extension.
     *
     * @param {string} fileName Selected image filename.
     * @returns {string} Image MIME type.
     */
    function getImageMimeType(fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();

        return imageAsset.mimeType || (extension === 'png'
            ? 'image/png'
            : extension === 'webp'
                ? 'image/webp'
                : 'image/jpeg');
    }
    /**
     * Adds selected image data to the menu item payload in a platform-safe way.
     *
     * @param {FormData} formData Menu item form payload.
     * @returns {Promise<boolean>} True when image data was appended.
     */
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
    /**
     * Builds a serializable menu item payload that can be sent now or queued offline.
     *
     * @returns {Promise<object>} Plain menu item payload.
     */
    async function buildMenuItemPayload() {
        const selectedCategory = getSelectedCategory();
        const selectedCategoryId = getCategoryId(selectedCategory) || category;
        const selectedCategoryName = getCategoryLabel(selectedCategory) || category;
        const payload = {
            name: name.trim(),
            description: description.trim(),
            price: String(Number(price)),
            categoryId: String(selectedCategoryId),
            categoryName: String(selectedCategoryName),
            dietaryFlags: buildDietaryFlagsObject(dietaryFlags),
            ingredients: [],
            allergens: [],
            isAvailable: String(isAvailable),
            isSpecial: 'false',
            photoUrl: imageUri ? imageUri.replace(API_BASE_URL, '') : '',
        };

        if (imageAsset?.uri && Platform.OS !== 'web') {
            const fileName = getImageFileName();
            const mimeType = getImageMimeType(fileName);

            payload.photoUrl = imageAsset.base64
                ? `data:${mimeType};base64,${imageAsset.base64}`
                : imageAsset.uri;
        }

        return payload;
    }
    /**
     * Converts a serializable menu item payload into FormData for the backend.
     *
     * @param {object} payload Plain menu item payload.
     * @returns {FormData} FormData payload for create or update.
     */
    function buildMenuFormDataFromPayload(payload) {
        const formData = new FormData();

        formData.append('name', payload.name);
        formData.append('description', payload.description);
        formData.append('price', payload.price);
        formData.append('categoryId', payload.categoryId);
        formData.append('categoryName', payload.categoryName);
        formData.append('dietaryFlags', JSON.stringify(payload.dietaryFlags));
        formData.append('ingredients', JSON.stringify(payload.ingredients));
        formData.append('allergens', JSON.stringify(payload.allergens));
        formData.append('isAvailable', payload.isAvailable);
        formData.append('isSpecial', payload.isSpecial);

        if (payload.photoUrl) {
            formData.append('photoUrl', payload.photoUrl);
        }

        return formData;
    }
    /**
     * Builds the multipart menu item payload expected by the backend.
     *
     * @returns {Promise<FormData>} FormData payload for create or update.
     */
    async function buildMenuFormData() {
        const payload = await buildMenuItemPayload();

        if (Platform.OS === 'web' && imageAsset?.uri) {
            const formData = buildMenuFormDataFromPayload({
                ...payload,
                photoUrl: '',
            });
            const imageWasAppended = await appendImageToFormData(formData);

            if (!imageWasAppended && payload.photoUrl) {
                formData.append('photoUrl', payload.photoUrl);
            }

            return formData;
        }

        return buildMenuFormDataFromPayload(payload);
    }
    /**
     * Loads menu categories for the category selector.
     *
     * @returns {Promise<void>} Resolves after category state has been refreshed.
     */
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
    /**
     * Stores a failed menu item save locally so it can sync later.
     *
     * @param {object} menuPayload Serializable menu item payload.
     * @param {'POST'|'PUT'} method Backend method to use when syncing.
     * @param {string} endpoint Backend endpoint to call when syncing.
     * @returns {Promise<void>} Resolves after the pending menu item is cached.
     */
    async function savePendingMenuItem(menuPayload, method, endpoint) {
        await addToCacheQueue(CACHE_KEYS.pendingMenuItems, {
            queueId: `menu-item-${Date.now()}`,
            createdAt: new Date().toISOString(),
            method,
            endpoint,
            menuPayload,
        });
    }
    /**
     * Attempts to send locally queued menu item saves to the backend.
     *
     * @returns {Promise<void>} Resolves after all reachable pending menu items have synced.
     */
    async function syncPendingMenuItems() {
        const pendingMenuItems = await getCache(CACHE_KEYS.pendingMenuItems, []);

        if (pendingMenuItems.length === 0) return;

        const remainingMenuItems = [];

        for (const pendingItem of pendingMenuItems) {
            try {
                await apiFetch(pendingItem.endpoint, {
                    method: pendingItem.method,
                    body: buildMenuFormDataFromPayload(pendingItem.menuPayload),
                });
            } catch (err) {
                console.log('Pending menu item sync error:', err);
                remainingMenuItems.push(pendingItem);
            }
        }

        await setCache(CACHE_KEYS.pendingMenuItems, remainingMenuItems);

        if (remainingMenuItems.length < pendingMenuItems.length) {
            Alert.alert('Sync Complete', 'Saved offline menu items have been sent to the database.');
        }
    }
    /**
     * Resolves a menu item ID from possible backend field names.
     *
     * @param {object} item Menu item record.
     * @returns {string|number|undefined} Menu item identifier.
     */
    function getItemId(item) {
        return item.id || item._id || item.itemId || item.menuItemId;
    }
    /**
     * Builds category labels for the category cycling control.
     *
     * @returns {string[]} Category labels.
     */
    function getCategoryNames() {
        const names = categories
            .map(getCategoryLabel)
            .filter(Boolean);

        if (names.length === 0) {
            return ['Entrees', 'Mains', 'Desserts', 'Drinks', 'Sides', 'Specials'];
        }
        return names;
    }
    /**
     * Cycles the form category to the next available category option.
     *
     * @returns {void}
     */
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
    /**
     * Resolves the visible text for the current category selection.
     *
     * @returns {string} Current category label.
     */
    function getCategoryDisplayText() {
        const selectedCategory = getSelectedCategory();

        return getCategoryLabel(selectedCategory) || category;
    }

    /**
     * Adds or removes a dietary flag from the selected flag state.
     *
     * @param {string} flag Dietary flag code.
     * @returns {void}
     */
    function toggleFlag(flag) {
        setDietaryFlags(current => {
            const currentFlags = normalizeDietaryFlags(current);

            if (currentFlags.includes(flag)) {
                return currentFlags.filter(item => item !== flag);
            }

            return [...currentFlags, flag];
        });
    }
    /**
     * Validates the menu item form before saving.
     *
     * @returns {boolean} True when the form can be submitted.
     */
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
    /**
     * Requests media permission and lets the manager choose an item photo.
     *
     * @returns {Promise<void>} Resolves after image selection completes or is cancelled.
     */
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
    /**
     * Creates or updates the menu item and returns to menu management.
     *
     * @returns {Promise<void>} Resolves after the save attempt completes.
     */
    async function handleSave() {
        if (!validateForm()) return;

        try {
            setSaving(true);
            const menuPayload = await buildMenuItemPayload();
            const payload = Platform.OS === 'web' && imageAsset?.uri
                ? await buildMenuFormData()
                : buildMenuFormDataFromPayload(menuPayload);

            if (isEditing) {
                const endpoint = `${MENU_ENDPOINT}/${getItemId(editingItem)}`;

                await apiFetch(endpoint, {
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

            const menuPayload = await buildMenuItemPayload();
            const method = isEditing ? 'PUT' : 'POST';
            const endpoint = isEditing
                ? `${MENU_ENDPOINT}/${getItemId(editingItem)}`
                : MENU_ENDPOINT;

            await savePendingMenuItem(menuPayload, method, endpoint);

            Alert.alert(
                'Offline Mode',
                'No internet connection. This menu item was saved on this device and will sync when the connection returns.'
            );
            navigation.navigate('ManageMenu');
        } finally {
            setSaving(false);
        }
    }
    /**
     * Renders one dietary flag toggle button.
     *
     * @param {string} flag Dietary flag code.
     * @param {string} label Button label.
     * @returns {React.ReactElement} Dietary flag toggle.
     */
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
            <OfflineHeaderBadge />

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
