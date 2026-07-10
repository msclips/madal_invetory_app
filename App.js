import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

// API Client
import { setupInterceptors } from './services/api';
import { AuthContext } from './services/authContext';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import DashboardScreen from './screens/dashboard/DashboardScreen';
import ItemsScreen from './screens/item/ItemsScreen';
import OpeningStockScreen from './screens/openingStock/OpeningStockScreen';
import ItemInwardScreen from './screens/itemInward/ItemInwardScreen';
import ItemOutwardScreen from './screens/itemOutward/ItemOutwardScreen';

import { Colors } from './components/UI';

const Stack = createNativeStackNavigator();

export default function App() {
  const [state, setState] = useState({
    isLoading: true,
    accessToken: null,
    user: null,
  });

  // Load token and user from SecureStore on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      let accessToken = null;
      let user = null;

      try {
        accessToken = await SecureStore.getItemAsync('accessToken');
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) {
          user = JSON.parse(userStr);
        }
      } catch (e) {
        console.log('Restoring token failed', e);
      }

      setState({
        isLoading: false,
        accessToken,
        user,
      });
    };

    bootstrapAsync();
  }, []);

  const authContextValue = useMemo(() => ({
    signIn: async (token, user) => {
      try {
        await SecureStore.setItemAsync('accessToken', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
      } catch (e) {
        console.log('Error saving token', e);
      }
      setState({
        isLoading: false,
        accessToken: token,
        user: user,
      });
    },
    signOut: async () => {
      try {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('user');
      } catch (e) {
        console.log('Error deleting token', e);
      }
      setState({
        isLoading: false,
        accessToken: null,
        user: null,
      });
    },
    accessToken: state.accessToken,
    user: state.user,
  }), [state.accessToken, state.user]);

  // Setup interceptors to handle 401 Unauthorized errors and force sign out
  useEffect(() => {
    setupInterceptors(authContextValue.signOut);
  }, [authContextValue]);

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.text} />
      </View>
    );
  }

  // Header styles for Stack Navigation
  const headerOptions = {
    headerStyle: {
      backgroundColor: Colors.card,
      shadowColor: 'transparent',
      elevation: 0,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTintColor: Colors.text,
    headerTitleStyle: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    headerBackTitleVisible: false,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthContext.Provider value={authContextValue}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
          <NavigationContainer theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: Colors.primary,
              background: Colors.background,
              card: Colors.card,
              text: Colors.text,
              border: Colors.border,
              notification: Colors.destructive,
            }
          }}>
            <Stack.Navigator screenOptions={headerOptions}>
              {state.accessToken === null ? (
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen} 
                  options={{ headerShown: false }}
                />
              ) : (
                <>
                  <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen} 
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="Items" 
                    component={ItemsScreen} 
                    options={{ title: 'Items' }}
                  />
                  <Stack.Screen 
                    name="OpeningStock" 
                    component={OpeningStockScreen} 
                    options={{ title: 'Opening Stock' }}
                  />
                  <Stack.Screen 
                    name="ItemInward" 
                    component={ItemInwardScreen} 
                    options={{ title: 'Item Inward' }}
                  />
                  <Stack.Screen 
                    name="ItemOutward" 
                    component={ItemOutwardScreen} 
                    options={{ title: 'Item Outward' }}
                  />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
