import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import EscalationsScreen from '../screens/EscalationsScreen';
import GuestHistoryListScreen from '../screens/GuestHistoryListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import FeedbackDetailScreen from '../screens/FeedbackDetailScreen';
import GuestHistoryScreen from '../screens/GuestHistoryScreen';
import NotificationChannelScreen from '../screens/NotificationChannelScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Escalations') {
            iconName = focused ? 'alert-circle' : 'alert-circle-outline';
          } else if (route.name === 'Guest History') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9B5DE5',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#9B5DE5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Escalations" 
        component={EscalationsScreen}
        options={{ title: 'Priority Escalations' }}
      />
      <Tab.Screen 
        name="Guest History" 
        component={GuestHistoryListScreen}
        options={{ title: 'Guest History' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Business Settings' }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator for authenticated users
function AuthenticatedNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#9B5DE5',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FeedbackDetail" 
        component={FeedbackDetailScreen}
        options={{ 
          title: 'Feedback Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="GuestHistory" 
        component={GuestHistoryScreen}
        options={{ 
          title: 'Guest History',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="NotificationChannel" 
        component={NotificationChannelScreen}
        options={{ 
          title: 'Notification Settings',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}