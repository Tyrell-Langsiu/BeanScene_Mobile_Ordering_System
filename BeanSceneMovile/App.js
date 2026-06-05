import * as React from 'react';
import {useState, useEffect} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles';

import LoginScreen from './screens/login.js';
import MenuScreen from './screens/menu.js';
import ItemDetailsScreen from './screens/itemDetails.js';
import OrderScreen from './screens/order.js';
import TableScreen from './screens/table.js';
import CartScreen from './screens/cart.js';
import ManagerScreen from './screens/manager.js';

const Tab = createBottomTabNavigator();

const MenuStack = createNativeStackNavigator();

function MenuStackScreen() {
  return (
    <MenuStack.Navigator screenOptions={{headerShown: false}}>
      <MenuStack.Screen name="MenuList" component={MenuScreen} />
      <MenuStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
    </MenuStack.Navigator>
  )
}

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
        return <Ionicons name="ellipse" size={23} color={color} />;
      },
    })}
    >
      <Tab.Screen name="Menu" component={MenuStackScreen} />
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
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
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
      <View style={styles.centeredContainer}>
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

