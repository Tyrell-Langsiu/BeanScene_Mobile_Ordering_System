import React, {useState} from 'react';
import {View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../styles';
import { apiFetch } from '../components/apiFetch.js';

const LOGIN_ENDPOINT = '/api/auth/login'

/**
 * Renders the staff login form and stores the authenticated user session.
 *
 * @param {object} props Screen props.
 * @param {(user: object) => void} props.onLoginSuccess Called after a successful login.
 * @returns {React.ReactElement} Login screen UI.
 */
export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    /**
     * Validates credentials, clears stale auth state, and stores the returned staff session.
     *
     * @returns {Promise<void>} Resolves after login succeeds or an error message is shown.
     */
    async function handleLogin() {
        try {
            setLoading(true);
            setErrorMessage('');

            if (!email.trim() || !password.trim()) {
                setErrorMessage('Email and password are required.');
                return;
            }

            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            
            const data = await apiFetch(LOGIN_ENDPOINT, {
                method: 'POST',
                skipAuth: true,
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password,
                }),
            });
            
            const responseData = data.data || data;
            const token = responseData.token || responseData.accessToken;
            const user = responseData.user || responseData.staff || responseData.account;

            if (!token || !user) {
                setErrorMessage('Login succeeded, but the server did not return the account details.');
                return;
            }

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            onLoginSuccess(user);
        } catch (err) {
            console.log(err);
            setErrorMessage(err.message || 'Unable to login. Please try again.');
        } finally {
            setLoading(false);
        }
    }
    return (
        <KeyboardAvoidingView
            style={styles.loginContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.topSection}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>BS</Text>
                </View>

                <Text style={styles.appTitle}>Bean Scene</Text>
            <Text style={styles.appSubtitle}>Restaurant Ordering System</Text>
            </View>

            <View style={styles.loginCard}>
                <Text style={styles.loginTitle}>Staff Login</Text>

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                {errorMessage ? (
                    <Text style={styles.loginErrorText}>{errorMessage}</Text>
                ) : null}
                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                </TouchableOpacity>
                <Text style={styles.helpText}>
                    Forgot your password? Contact your manager.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    loginContainer: {
        flex: 1,
        backgroundColor: colors.primaryDark,
        justifyContent: 'center',
    },
    topSection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        color: colors.white,
        fontSize: 30,
        fontWeight: '800',
    },
    appTitle: {
        color: colors.muted,
        fontSize: 30,
        fontWeight: '700',
    },
    appSubtitle: {
        color: colors.white,
        fontSize: 13,
        marginTop: 4,
    },
    loginCard: {
        backgroundColor: colors.white,
        borderRadius: 22,
        padding: 24,
        marginHorizontal: 22,
    },
    loginTitle: {
        color: '#27656D',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 25,
    },
    label: {
        color: '#17474E',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 7,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#DFE5E6',
        borderRadius: 9,
        paddingHorizontal: 12,
        backgroundColor: colors.white,
        marginBottom: 15,
        color: '#222',
    },
    loginErrorText: {
        color: colors.danger,
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: colors.accent,
        height: 48,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    helpText: {
        color: '#4B6266',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 13,
    },
});
