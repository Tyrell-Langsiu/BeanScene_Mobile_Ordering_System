import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'beanSceneCache';

export const CACHE_KEYS = {
    cart: `${CACHE_PREFIX}:cart`,
    orders: `${CACHE_PREFIX}:orders`,
    tables: `${CACHE_PREFIX}:tables`,
    tableOrders: `${CACHE_PREFIX}:tableOrders`,
    menuItemDetails: (itemId) => `${CACHE_PREFIX}:menuItemDetails:${itemId}`,
};

export async function getCache(key, fallbackValue = null) {
    try {
        const cachedValue = await AsyncStorage.getItem(key);

        return cachedValue ? JSON.parse(cachedValue) : fallbackValue;
    } catch (err) {
        console.log('Cache read error:', err);
        return fallbackValue;
    }
}

export async function setCache(key, value) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
        console.log('Cache write error:', err);
    }
}

export async function removeCache(key) {
    try {
        await AsyncStorage.removeItem(key);
    } catch (err) {
        console.log('Cache remove error:', err);
    }
}
