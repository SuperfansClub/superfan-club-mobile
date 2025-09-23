import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

interface Restaurant {
  id: string;
  name: string;
  contactPhone?: string;
  whatsappNumber?: string;
  latitude?: string;
  longitude?: string;
  googleMapsUrl?: string;
  googleReviewsUrl?: string;
  escalationKeywords?: string;
}

const API_BASE_URL = 'https://56ac3b63-8319-469f-bf69-ed75605af1f3-00-1my3hb9q1uspg.picard.replit.dev'; // Your Replit app URL

export default function RestaurantSettingsScreen({ navigation }: any) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/restaurant`);
      setRestaurant(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
      Alert.alert('Error', 'Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const saveRestaurant = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/restaurant`, formData);
      setRestaurant({ ...restaurant, ...formData } as Restaurant);
      Alert.alert('Success', 'Restaurant settings updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save restaurant:', error);
      Alert.alert('Error', 'Failed to save restaurant settings');
    } finally {
      setSaving(false);
    }
  };

  const extractCoordinates = () => {
    const url = formData.googleMapsUrl;
    if (!url) {
      Alert.alert('Error', 'Please enter a Google Maps URL first');
      return;
    }

    // Extract coordinates from Google Maps URL
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        setFormData({
          ...formData,
          latitude: match[1],
          longitude: match[2]
        });
        Alert.alert('Success', `Coordinates extracted: ${match[1]}, ${match[2]}`);
        return;
      }
    }

    Alert.alert('Error', 'Could not extract coordinates from URL');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading restaurant settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Restaurant Settings</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name || ''}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter restaurant name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.contactPhone || ''}
              onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp Number (for alerts)</Text>
            <TextInput
              style={styles.input}
              value={formData.whatsappNumber || ''}
              onChangeText={(text) => setFormData({ ...formData, whatsappNumber: text })}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
            />
            <Text style={styles.helpText}>
              This number will receive SMS/WhatsApp alerts for customer issues
            </Text>
          </View>
        </View>

        {/* Location Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Google Maps URL</Text>
            <TextInput
              style={styles.input}
              value={formData.googleMapsUrl || ''}
              onChangeText={(text) => setFormData({ ...formData, googleMapsUrl: text })}
              placeholder="https://maps.google.com/..."
              multiline
            />
            <TouchableOpacity style={styles.extractButton} onPress={extractCoordinates}>
              <Text style={styles.extractButtonText}>Extract Coordinates</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.coordinateRow}>
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={formData.latitude || ''}
                onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                placeholder="19.0760"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.coordinateInput}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={formData.longitude || ''}
                onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                placeholder="72.8777"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Review Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Google Reviews URL</Text>
            <TextInput
              style={styles.input}
              value={formData.googleReviewsUrl || ''}
              onChangeText={(text) => setFormData({ ...formData, googleReviewsUrl: text })}
              placeholder="https://g.page/r/..."
              multiline
            />
            <Text style={styles.helpText}>
              Customers with good ratings will be redirected here to leave Google reviews
            </Text>
          </View>
        </View>

        {/* Escalation Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escalation Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Custom Keywords (comma-separated)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.escalationKeywords || ''}
              onChangeText={(text) => setFormData({ ...formData, escalationKeywords: text })}
              placeholder="slow, cold, rude, dirty, bad, terrible"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.helpText}>
              Add custom words that should trigger escalation alerts when mentioned in feedback
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveRestaurant}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 16,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  extractButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  extractButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});