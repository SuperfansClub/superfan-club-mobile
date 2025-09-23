import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  sendTokenToServer: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_BASE_URL = 'https://56ac3b63-8319-469f-bf69-ed75605af1f3-00-1my3hb9q1uspg.picard.replit.dev'; // Your Replit app URL

export function NotificationProvider({ 
  children, 
  expoPushToken 
}: { 
  children: ReactNode;
  expoPushToken: string;
}) {
  
  useEffect(() => {
    if (expoPushToken) {
      sendTokenToServer();
    }
  }, [expoPushToken]);

  const sendTokenToServer = async () => {
    try {
      if (!expoPushToken) return;
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      // Send push token to server for notifications
      await axios.post(`${API_BASE_URL}/api/register-push-token`, {
        expoPushToken,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Push token registered with server');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ sendTokenToServer }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}