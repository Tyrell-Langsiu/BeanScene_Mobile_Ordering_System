import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'beanSceneCache';

export const CACHE_KEYS = {
    cart: `${CACHE_PREFIX}:cart`,
    menuItems: `${CACHE_PREFIX}:menuItems`,
    menuCategories: `${CACHE_PREFIX}:menuCategories`,
    offlineMode: `${CACHE_PREFIX}:offlineMode`,
    orders: `${CACHE_PREFIX}:orders`,
    pendingOrders: `${CACHE_PREFIX}:pendingOrders`,
    pendingMenuItems: `${CACHE_PREFIX}:pendingMenuItems`,
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

/**
 * Adds an item to a cached offline queue.
 *
 * @param {string} key Cache key for the queue.
 * @param {object} item Queue item to append.
 * @returns {Promise<object[]>} Updated queue.
 */
export async function addToCacheQueue(key, item) {
    const currentQueue = await getCache(key, []);
    const updatedQueue = [...currentQueue, item];

    await setCache(key, updatedQueue);

    return updatedQueue;
}

/**
 * Removes an item from a cached offline queue by queue ID.
 *
 * @param {string} key Cache key for the queue.
 * @param {string} queueId Queue item ID.
 * @returns {Promise<object[]>} Updated queue.
 */
export async function removeFromCacheQueue(key, queueId) {
    const currentQueue = await getCache(key, []);
    const updatedQueue = currentQueue.filter(item => item.queueId !== queueId);

    await setCache(key, updatedQueue);

    return updatedQueue;
}
