import * as React from 'react';
import {useState, useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

import LoginScreen from './screens/login.js';
import MenuScreen from './screens/menu.js';
import OrderScreen from './screens/order.js';
import TableScreen from './screens/table.js';
import CartScreen from './screens/cart.js';
import ManagerScreen from './screens/manager.js';

const Tab = createBottomTabNavigator();

function BottomTabs({onLogout}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
      headerShown: false,

      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#C8D6D9',
      tabBarInactiveTintColor: '#C8D6D9',
      tabBarLabelStyle: styles.tabLabel,

      tabBarIcon: ({ color }) => {
        if (route.name === 'Menu') {
          return <Ionicons name="menu" size={23} color={color} />;
        }
        if (route.name === 'Table') {
          return (
            <MaterialCommunityIcons name="table-furniture"
              size={23}
              color={color}
              />
          );
        }
        if (route.name === 'Cart') {
          return <Ionicons name="cart-outline" size={23} color={color} />;
        }
        if (route.name === 'Order') {
          return <Ionicons name="receipt-outline" size={23} color={color} />;
        }
        if (route.name === 'Manager') {
          return <Ionicons name="settings-outline" size={23} color={color} />;
        }
        return <Ionicons name="ellipse" size={size} color={color} />;
      },
    })}
    >
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Table" component={TableScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Order" component={OrderScreen} />
      <Tab.Screen name="Manager">
        {(props) => <ManagerScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
    );
}

export default function App() {
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    checkedSavedLogin();
  }, []);

  async function checkedSavedLogin() {
    try {
      const token = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (token && savedUser) {
        setLoggedInUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.log(err);
    } finally {
      setCheckingLogin(false);
    }
  }
  function handleLoginSuccess(user) {
    setLoggedInUser(user);
  }
  async function handleLogout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setLoggedInUser(null);
  }
  if (checkingLogin) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#063F46" />
      </View>
    );
  }
    
  return (
    <NavigationContainer>
      {loggedInUser ? (
        <BottomTabs onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7F7',
  },
  header: {
    backgroundColor: '#073B4C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabBar: {
    backgroundColor: '#073B4C',
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0,
  }, tabLabel: {
    fontSize: 11,
    marginTop: 2,
  }
})