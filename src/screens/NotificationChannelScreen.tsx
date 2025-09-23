import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import { useAuth } from '../context/AuthContext';

type SeverityLevel = 'low' | 'medium' | 'high';

interface DeviceRegistration {
  id: string;
  deviceSecret: string;
  subscriptionSeverity: SeverityLevel;
}

export default function NotificationChannelScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceRegistration, setDeviceRegistration] = useState<DeviceRegistration | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>('medium');
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    initializeNotificationChannel();
  }, []);

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
    } finally {
      setLoading(false);
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
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Channels</Text>
        <Text style={styles.headerSubtitle}>
          Choose which priority level of escalations you want to receive on this device
        </Text>
      </View>

      {/* Permission Status */}
      <View style={styles.section}>
        <View style={styles.permissionStatus}>
          <Ionicons
            name={permissionStatus === 'granted' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={permissionStatus === 'granted' ? '#10B981' : '#F59E0B'}
          />
          <Text style={styles.permissionText}>
            Notifications: {permissionStatus === 'granted' ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>

      {/* Device Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Status</Text>
        <View style={styles.deviceStatus}>
          <Ionicons
            name={deviceRegistration ? 'phone-portrait' : 'phone-portrait-outline'}
            size={20}
            color={deviceRegistration ? '#10B981' : '#6B7280'}
          />
          <Text style={styles.deviceStatusText}>
            {deviceRegistration 
              ? `Registered for ${deviceRegistration.subscriptionSeverity.toUpperCase()} priority`
              : 'Not registered'
            }
          </Text>
        </View>
      </View>

      {/* Severity Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Priority Level</Text>
        {severityOptions.map((option) => (
          <SeverityOption key={option.level} option={option} />
        ))}
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        {!deviceRegistration ? (
          <TouchableOpacity
            style={[styles.registerButton, registering && styles.disabledButton]}
            onPress={registerDevice}
            disabled={registering}
          >
            {registering ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="add-circle" size={20} color="white" />
            )}
            <Text style={styles.registerButtonText}>
              {registering ? 'Registering...' : 'Register Device'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.registeredInfo}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.registeredText}>
              Device registered and active
            </Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            You can change your notification priority at any time
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            Your device registration is secure and encrypted
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceStatusText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  severityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B5DE5',
    padding: 16,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  registeredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
  },
  registeredText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 40,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
});