import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_KEYS, setCache } from './cache.js';

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL || 'https://beansceneorderingsystem.onrender.com';

export async function apiFetch(endpoint, options ={}) {
    const { skipAuth = false, ...fetchOptions } = options;
    const token = await AsyncStorage.getItem('token');

    const isFormData =
        typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
       
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(!skipAuth && token ? {Authorization: `Bearer ${token}`} : {}),
        ...(fetchOptions.headers || {}),
    };

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
        });
        await setCache(CACHE_KEYS.offlineMode, false);
    } catch (err) {
        await setCache(CACHE_KEYS.offlineMode, true);
        throw err;
    }

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (response.status === 401) {
        if (!skipAuth) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            throw new Error('Your session has expired. Please log in again.');
        }

        throw new Error(data?.message || data?.error || 'Invalid email or password.');
    }

    if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Something went wrong.');
    }

    return data;
}
