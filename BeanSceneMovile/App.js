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

import StaffMemberScreen from './screens/managerScreens/staff.js';
import AddEditStaffScreen from './screens/managerScreens/addEditStaff.js';
import ManageMenuScreen from './screens/managerScreens/manageMenu.js';
import AddEditMenuScreen from './screens/managerScreens/addEditMenu.js';
import AddEditCategoryScreen from './screens/managerScreens/addEditCategory.js';
import ReportsScreen from './screens/managerScreens/reports.js';

/**
 * Bottom tab navigator used for the main authenticated app navigation.
 * 
 * @constant
 */
const Tab = createBottomTabNavigator();
/**
 * Stack navigator used for the menu section.
 * This allows the user to move from the menu list screen to the item details screen.
 * 
 * @constant
 */
const MenuStack = createNativeStackNavigator();
/**
 * Displays the menu stack navigation.
 * 
 * Screens included:
 * - MenuList: shows all available menu items.
 * - ItemDetails: show details for a selected menu item.
 * 
 * @returns {JSX.Element} The menu stack navigator
 */
function MenuStackScreen() {
  return (
    <MenuStack.Navigator screenOptions={{headerShown: false}}>
      <MenuStack.Screen name="MenuList" component={MenuScreen} />
      <MenuStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
    </MenuStack.Navigator>
  );
}

/**
 * Stack navigator used for the manager section.
 * This separates manager-related screens from the main bottom tab navigation.
 * 
 * @constant
 */
const ManagerStack = createNativeStackNavigator();

/**
 * Displays the manager stack navigation.
 * 
 * This stack includes manager-only features such as:
 * - Managing staff accounts
 * - Managing menu items
 * - Managing categories
 * - Viewing reports
 * 
 * @param {Object} props - Component props.
 * @param {Function} prop.onLogout - Function used to log the current user out.
 * @param {Object|null} props.user - The currently logged-in user object.
 * @returns {JSX.Element} The manager stack navigator.
 */

function ManagerStackScreen({ onLogout, user }) {
  return (
    <ManagerStack.Navigator screenOptions={{headerShown: false}}>
      <ManagerStack.Screen name="Manage">
        {(props) => <ManagerScreen {...props} onLogout={onLogout} user={user} />}
      </ManagerStack.Screen>
      <ManagerStack.Screen name="StaffMembers" component={StaffMemberScreen} />
      <ManagerStack.Screen name="AddStaff" component={AddEditStaffScreen} />
      <ManagerStack.Screen name="EditStaff" component = {AddEditStaffScreen} />
      <ManagerStack.Screen name="ManageMenu" component={ManageMenuScreen} />
      <ManagerStack.Screen name="AddMenu" component={AddEditMenuScreen} />
      <ManagerStack.Screen name="EditMenu" component={AddEditMenuScreen} />
      <ManagerStack.Screen name="AddCategory" component={AddEditCategoryScreen} />
      <ManagerStack.Screen name="EditCategory" component={AddEditCategoryScreen} />
      <ManagerStack.Screen name="Reports" component={ReportsScreen} />
    </ManagerStack.Navigator>
  );
}

/**
 * Displays the main bottom tab navigation after the user has logged in.
 * 
 * The bottom tabs provide access to the main sections of the ordering system:
 * - Menu
 * - Table
 * - Cart
 * - Order
 * - Manager
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.onLogout - Function used to clear login data and log out.
 * @param {Object|null} props.user - The currently logged-in user object.
 * @returns {JSX.Element} The authenticated bottom tab navigator.
 */
function BottomTabs({onLogout, user}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
      headerShown: false,

      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#C8D6D9',
      tabBarInactiveTintColor: '#C8D6D9',
      tabBarLabelStyle: styles.tabLabel,

      /**
       * Selects the correct icon for each bottom tab.
       * 
       * @param {Object} iconProps - Icon properties from React Navigation
       * @param {string} iconProps.color - The current tab icon colour.
       * @returns {JSX.Element} The icon for the current tab.
       */

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
        {() => <ManagerStackScreen onLogout={onLogout} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
    );
}

/**
 * Root component for the Bean Scene mobile ordering application.
 * 
 * This component is responsible for:
 * - Checking if a saved login token exists in AsyncStorage.
 * - RAestoring the saved user session.
 * - Showing a loading indicator while checking login status.
 * - Showing the login screen if the user is not logged in.
 * - Showing the main application tabs if the user is logged in.
 * 
 * @returns {JSX.Element} The root application component.
 */

export default function App() {
  /**
   * Tracks whether the app is still checking saved login data.
   * 
   * @type {[boolean, Function]}
   */
  const [checkingLogin, setCheckingLogin] = useState(true);
  /**
   * Stores the currently logged-in user.
   * If null, the user is treated as logged out.
   * 
   * @type {[Object|null, Function]}
   */
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    checkedSavedLogin();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!loggedInUser) return;

      const token = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (!token || !savedUser) {
        setLoggedInUser(null);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [loggedInUser]);

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
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#063F46" />
      </View>
    );
  }
    
  return (
    <NavigationContainer>
      {loggedInUser ? (
        <BottomTabs onLogout={handleLogout} user={loggedInUser} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </NavigationContainer>
  );
}

