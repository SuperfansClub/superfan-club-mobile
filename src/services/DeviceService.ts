// Device service for managing device registration and device-filtered escalations
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface DeviceRegistration {
  id: string;
  deviceSecret: string;
  subscriptionSeverity: 'low' | 'medium' | 'high';
}

export interface DeviceFilteredEscalation {
  id: string;
  restaurantId: string;
  formData: any;
  customerName?: string;
  customerPhone?: string;
  feedbackType: 'inStore' | 'delivery';
  isEscalated: boolean;
  escalationReason?: string;
  createdAt: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  ratings: any;
  comments: any;
  primaryRating?: number;
  primaryComment?: string;
}

class DeviceService {
  private static instance: DeviceService;
  
  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  // Get stored device credentials
  async getDeviceCredentials(): Promise<{ deviceId: string; deviceSecret: string } | null> {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      const deviceSecret = await AsyncStorage.getItem('deviceSecret');
      
      if (!deviceId || !deviceSecret) {
        return null;
      }
      
      return { deviceId, deviceSecret };
    } catch (error) {
      console.error('Failed to get device credentials:', error);
      return null;
    }
  }

  // Get device registration from local storage
  async getDeviceRegistration(): Promise<DeviceRegistration | null> {
    try {
      const storedRegistration = await AsyncStorage.getItem('deviceRegistration');
      if (!storedRegistration) {
        return null;
      }
      return JSON.parse(storedRegistration);
    } catch (error) {
      console.error('Failed to get device registration:', error);
      return null;
    }
  }

  // Send device heartbeat with optional push token update
  async sendHeartbeat(pushToken?: string): Promise<boolean> {
    try {
      const credentials = await this.getDeviceCredentials();
      if (!credentials) {
        console.log('No device credentials found for heartbeat');
        return false;
      }

      const heartbeatData: any = {};
      if (pushToken) {
        heartbeatData.pushToken = pushToken;
      }

      await axios.post(
        buildApiUrl(API_ENDPOINTS.DEVICE_HEARTBEAT),
        heartbeatData,
        {
          headers: {
            'x-device-id': credentials.deviceId,
            'x-device-secret': credentials.deviceSecret,
          },
        }
      );

      console.log('Device heartbeat sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send device heartbeat:', error);
      return false;
    }
  }

  // Fetch device-filtered escalations
  async getDeviceFilteredEscalations(): Promise<DeviceFilteredEscalation[]> {
    try {
      const credentials = await this.getDeviceCredentials();
      if (!credentials) {
        console.log('No device credentials found for escalations');
        return [];
      }

      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.ESCALATIONS_DEVICE),
        {
          headers: {
            'x-device-id': credentials.deviceId,
            'x-device-secret': credentials.deviceSecret,
          },
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch device-filtered escalations:', error);
      throw error;
    }
  }

  // Check if device is registered
  async isDeviceRegistered(): Promise<boolean> {
    const registration = await this.getDeviceRegistration();
    const credentials = await this.getDeviceCredentials();
    return !!(registration && credentials);
  }

  // Get subscription severity level
  async getSubscriptionSeverity(): Promise<'low' | 'medium' | 'high' | null> {
    const registration = await this.getDeviceRegistration();
    return registration?.subscriptionSeverity || null;
  }

  // Clear device registration (for logout or re-registration)
  async clearDeviceRegistration(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'deviceRegistration',
        'deviceId',
        'deviceSecret',
      ]);
      console.log('Device registration cleared');
    } catch (error) {
      console.error('Failed to clear device registration:', error);
    }
  }

  // Update subscription severity (called from NotificationChannelScreen)
  async updateSubscriptionSeverity(newSeverity: 'low' | 'medium' | 'high'): Promise<boolean> {
    try {
      const credentials = await this.getDeviceCredentials();
      if (!credentials) {
        throw new Error('Device not registered');
      }

      const endpoint = API_ENDPOINTS.DEVICE_SUBSCRIPTION.replace(':deviceId', credentials.deviceId);
      
      const response = await axios.patch(
        buildApiUrl(endpoint),
        { subscriptionSeverity: newSeverity },
        {
          headers: {
            'x-device-secret': credentials.deviceSecret,
          },
        }
      );

      // Update local storage
      const registration = await this.getDeviceRegistration();
      if (registration) {
        const updatedRegistration = {
          ...registration,
          subscriptionSeverity: newSeverity,
        };
        await AsyncStorage.setItem('deviceRegistration', JSON.stringify(updatedRegistration));
      }

      console.log(`Subscription updated to ${newSeverity}`);
      return true;
    } catch (error) {
      console.error('Failed to update subscription severity:', error);
      return false;
    }
  }
}

export default DeviceService.getInstance();