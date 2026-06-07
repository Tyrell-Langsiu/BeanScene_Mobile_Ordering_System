import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = 'https://beansceneorderingsystem.onrender.com';

export async function apiFetch(endpoint, options ={}) {
    const token = await AsyncStorage.getItem('token');

    const headers = {
        'Content-Type':'application/json',
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
    }
    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }
    if (!response.ok) {
        throw new Error(data?.message || 'Something went wrong.');
    }

    return data;
}