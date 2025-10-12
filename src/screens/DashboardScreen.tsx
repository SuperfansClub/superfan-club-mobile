import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  escalatedIssues: number;
  thisMonthFeedbacks: number;
  ratingBreakdown: {
    foodQuality: number;
    service: number;
    cleanliness: number;
    washroom: number;
    staffBehavior: number;
  };
}

interface Restaurant {
  id: string;
  name: string;
  whatsappNumber?: string;
}

// API URLs are now handled by the centralized config

export default function DashboardScreen() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch restaurant info
      const restaurantResponse = await axios.get(buildApiUrl(API_ENDPOINTS.RESTAURANT));
      setRestaurant(restaurantResponse.data);

      // Fetch stats
      const statsResponse = await axios.get(buildApiUrl(API_ENDPOINTS.RESTAURANT_STATS));
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const exportFeedback = async () => {
    try {
      Alert.alert(
        'Export Feedback',
        'This will download a CSV file with all feedback data. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Export', 
            onPress: async () => {
              try {
                const response = await axios.get(buildApiUrl(API_ENDPOINTS.RESTAURANT_EXPORT), {
                  responseType: 'blob'
                });
                
                Alert.alert(
                  'Export Complete',
                  'Feedback data has been exported. Check your downloads folder.'
                );
              } catch (error) {
                Alert.alert('Export Failed', 'Could not export feedback data');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Export feature not available');
    }
  };

  const getStatusColor = (rating: number) => {
    if (rating >= 4) return '#10B981'; // Green
    if (rating >= 3) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Restaurant Header */}
      <View style={styles.header}>
        <Text style={styles.restaurantName}>{restaurant?.name}</Text>
        <Text style={styles.subtitle}>Superfan Club Dashboard</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles-outline" size={24} color="#9B5DE5" />
          <Text style={styles.statNumber}>{stats?.totalFeedbacks || 0}</Text>
          <Text style={styles.statLabel}>Total Superfan Feedback</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="warning-outline" size={24} color="#FF006E" />
          <Text style={styles.statNumber}>{stats?.escalatedIssues || 0}</Text>
          <Text style={styles.statLabel}>Escalated Issues</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#00F5D4" />
          <Text style={styles.statNumber}>{stats?.thisMonthFeedbacks || 0}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Rating Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating Breakdown</Text>
        
        {stats?.ratingBreakdown && Object.entries(stats.ratingBreakdown).map(([key, value]) => (
          <View key={key} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </Text>
            <View style={styles.ratingBar}>
              <View 
                style={[
                  styles.ratingFill, 
                  { 
                    width: `${(value / 5) * 100}%`,
                    backgroundColor: getStatusColor(value)
                  }
                ]} 
              />
            </View>
            <Text style={styles.ratingValue}>{value.toFixed(1)}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // In a real app with navigation:
            // navigation.navigate('QRCode')
            Alert.alert('QR Code', 'Your permanent QR code for customer feedback collection. Print and place around your restaurant.');
          }}
        >
          <Ionicons name="qr-code-outline" size={20} color="#9B5DE5" />
          <Text style={styles.actionText}>View QR Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={exportFeedback}
        >
          <Ionicons name="download-outline" size={20} color="#9B5DE5" />
          <Text style={styles.actionText}>Export Feedback</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Push Notifications', 
            restaurant?.whatsappNumber ? 
            'Push notifications are enabled. You will receive alerts for escalated issues.' :
            'Setup WhatsApp number in settings to enable full notifications.'
          )}
        >
          <Ionicons name="notifications-outline" size={20} color="#9B5DE5" />
          <Text style={styles.actionText}>
            Notifications {restaurant?.whatsappNumber ? 'Enabled' : 'Setup Required'}
          </Text>
        </TouchableOpacity>
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
  header: {
    backgroundColor: '#9B5DE5', // Superfan Club Electric Purple
    padding: 20,
    paddingTop: 40,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  ratingBar: {
    flex: 2,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  ratingFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
});