import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

interface Restaurant {
  id: string;
  name: string;
  whatsappNumber?: string;
  escalationKeywords?: string;
}

type SeverityLevel = 'low' | 'medium' | 'high';

interface DeviceRegistration {
  id: string;
  deviceSecret: string;
  subscriptionSeverity: SeverityLevel;
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceRegistration, setDeviceRegistration] = useState<DeviceRegistration | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('medium');
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    fetchRestaurant();
    initializeNotificationChannel();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const response = await axios.get(buildApiUrl(API_ENDPOINTS.RESTAURANT));
      setRestaurant(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeNotificationChannel = async () => {
    try {
      // Check notification permissions
      const permission = await Notifications.getPermissionsAsync();
      setPermissionStatus(permission.status);

      // Load existing device registration
      const storedRegistration = await AsyncStorage.getItem('deviceRegistration');
      if (storedRegistration) {
        const parsedRegistration = JSON.parse(storedRegistration);
        setDeviceRegistration(parsedRegistration);
        setSelectedSeverity(parsedRegistration.subscriptionSeverity);
      }
    } catch (error) {
      console.error('Failed to initialize notification channel:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      
      setPermissionStatus(permission.status);
      
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive escalation alerts.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const registerDevice = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to register your device');
      return;
    }

    setRegistering(true);
    
    try {
      // Request notification permission if not granted
      if (permissionStatus !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setRegistering(false);
          return;
        }
      }

      // Get push token
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: '2d3bb892-de50-45c1-9ce6-15e0bfd69c7a', // Replace with your Expo project ID
      });

      // Get device info
      const deviceId = Device.osInternalBuildId || Device.modelId || 'unknown';
      const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`;

      // Register device with server
      const response = await axios.post(buildApiUrl(API_ENDPOINTS.DEVICE_REGISTER), {
        deviceId,
        deviceName,
        pushToken: pushToken.data,
        subscriptionSeverity: selectedSeverity,
      });

      const registration: DeviceRegistration = {
        id: response.data.id,
        deviceSecret: response.data.deviceSecret,
        subscriptionSeverity: response.data.subscriptionSeverity,
      };

      // Store registration locally
      await AsyncStorage.setItem('deviceRegistration', JSON.stringify(registration));
      await AsyncStorage.setItem('deviceId', deviceId);
      await AsyncStorage.setItem('deviceSecret', registration.deviceSecret);

      setDeviceRegistration(registration);

      Alert.alert(
        'Device Registered',
        `Your device is now subscribed to ${selectedSeverity.toUpperCase()} priority notifications.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to register device:', error);
      Alert.alert(
        'Registration Failed',
        'Unable to register your device for notifications. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRegistering(false);
    }
  };

  const updateSubscription = async (newSeverity: SeverityLevel) => {
    if (!deviceRegistration) {
      Alert.alert('Error', 'Device not registered. Please register first.');
      return;
    }

    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      const deviceSecret = await AsyncStorage.getItem('deviceSecret');

      if (!deviceId || !deviceSecret) {
        Alert.alert('Error', 'Device credentials not found. Please re-register.');
        return;
      }

      const endpoint = API_ENDPOINTS.DEVICE_SUBSCRIPTION.replace(':deviceId', deviceId);
      
      await axios.patch(buildApiUrl(endpoint), {
        subscriptionSeverity: newSeverity,
      }, {
        headers: {
          'x-device-secret': deviceSecret,
        },
      });

      const updatedRegistration = {
        ...deviceRegistration,
        subscriptionSeverity: newSeverity,
      };

      await AsyncStorage.setItem('deviceRegistration', JSON.stringify(updatedRegistration));
      setDeviceRegistration(updatedRegistration);
      setSelectedSeverity(newSeverity);

      Alert.alert(
        'Subscription Updated',
        `You will now receive ${newSeverity.toUpperCase()} priority notifications.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update subscription:', error);
      Alert.alert(
        'Update Failed',
        'Unable to update your notification subscription. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const severityOptions = [
    {
      level: 'high' as SeverityLevel,
      title: 'High Priority Only',
      description: 'Critical issues and serious complaints only',
      icon: 'alert-circle',
      color: '#EF4444',
      bgColor: '#FEF2F2',
    },
    {
      level: 'medium' as SeverityLevel,
      title: 'Medium Priority',
      description: 'Moderate issues requiring attention',
      icon: 'warning',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      level: 'low' as SeverityLevel,
      title: 'All Notifications',
      description: 'All escalated feedback and minor issues',
      icon: 'information-circle',
      color: '#3B82F6',
      bgColor: '#EBF4FF',
    },
  ];

  const SeverityOption = ({ option }: { option: typeof severityOptions[0] }) => {
    const isSelected = selectedSeverity === option.level;
    const isRegistered = !!deviceRegistration;

    return (
      <TouchableOpacity
        style={[
          styles.severityOption,
          { backgroundColor: option.bgColor },
          isSelected && styles.selectedOption,
        ]}
        onPress={() => {
          if (isRegistered) {
            updateSubscription(option.level);
          } else {
            setSelectedSeverity(option.level);
          }
        }}
        data-testid={`option-severity-${option.level}`}
      >
        <View style={styles.severityLeft}>
          <View style={[styles.severityIcon, { backgroundColor: option.color }]}>
            <Ionicons name={option.icon as any} size={24} color="white" />
          </View>
          <View style={styles.severityText}>
            <Text style={[styles.severityTitle, { color: option.color }]}>
              {option.title}
            </Text>
            <Text style={styles.severityDescription}>{option.description}</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={option.color} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#9B5DE5" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={32} color="white" />
        </View>
        <Text style={styles.userName} data-testid="text-username">{user?.username}</Text>
        <Text style={styles.userEmail} data-testid="text-business-name">{restaurant?.name}</Text>
      </View>

      {/* Notification Settings - Main Feature */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        
        <View style={styles.notificationStatus}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={deviceRegistration ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={deviceRegistration ? "#10B981" : "#EF4444"} 
            />
            <Text style={[styles.statusText, { color: deviceRegistration ? "#10B981" : "#EF4444" }]}>
              {deviceRegistration ? "Device Registered" : "Device Not Registered"}
            </Text>
          </View>
          <Text style={styles.statusSubtext}>
            {deviceRegistration 
              ? `Receiving ${deviceRegistration.subscriptionSeverity.toUpperCase()} priority alerts`
              : "Register this device to receive escalation notifications"
            }
          </Text>
        </View>

        {!deviceRegistration ? (
          <TouchableOpacity
            style={styles.registerButton}
            onPress={registerDevice}
            disabled={registering}
            data-testid="button-register-device"
          >
            {registering ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="phone-portrait" size={20} color="white" />
                <Text style={styles.registerButtonText}>Register This Device</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Notification Priority Levels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Priority</Text>
        <Text style={styles.sectionSubtitle}>
          Choose what types of escalations you want to receive on this device
        </Text>
        
        {severityOptions.map((option) => (
          <SeverityOption key={option.level} option={option} />
        ))}
      </View>

      {/* Restaurant Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Settings</Text>
        
        <TouchableOpacity style={styles.settingItem} data-testid="setting-restaurant-details">
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="restaurant-outline" size={20} color="#9B5DE5" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Restaurant Details</Text>
              <Text style={styles.settingSubtitle}>{restaurant?.name || 'Loading...'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} data-testid="setting-phone-alerts">
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={20} color="#9B5DE5" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>WhatsApp Number</Text>
              <Text style={styles.settingSubtitle}>{restaurant?.whatsappNumber || 'Not configured'}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem} data-testid="setting-keywords">
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={20} color="#9B5DE5" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Escalation Keywords</Text>
              <Text style={styles.settingSubtitle}>Manage trigger words</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          data-testid="button-logout"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  userSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9B5DE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  notificationStatus: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerButton: {
    backgroundColor: '#9B5DE5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#9B5DE5',
  },
  severityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  severityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  severityText: {
    flex: 1,
  },
  severityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  severityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});