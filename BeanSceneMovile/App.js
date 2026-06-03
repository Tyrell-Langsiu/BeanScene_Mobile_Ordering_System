import * as React from 'react';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

import MenuScreen from './screens/menu.js';
import OrderScreen from './screens/order.js';
import TableScreen from './screens/table.js';
import CartScreen from './screens/cart.js';
import ManagerScreen from './screens/manager.js';

const MyTabs = createBottomTabNavigator({
  screenOptions: ({ route }) => ({
    headerStyle: styles.header,
    headerTintColor: '#fff',
    headerTitleAlign: 'left',
    headerTitleStyle: styles.headerTitle,

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
    },
  }),
  screens: {
    Menu: MenuScreen,
    Table: TableScreen,
    Cart: CartScreen,
    Order: OrderScreen,
    Manager: ManagerScreen
  }
});

const Navigation = createStaticNavigation(MyTabs);

export default function App() {
  return <Navigation />;
}

const styles = StyleSheet.create({
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