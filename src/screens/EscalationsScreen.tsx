import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { buildApiUrl, API_ENDPOINTS } from '../config/api';

interface DeviceFilteredEscalation {
  id: string;
  customerName: string;
  customerPhone: string;
  primaryRating: number;
  comments: string;
  escalationReason: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  businessId: string;
  resolved: boolean;
}

type RootStackParamList = {
  FeedbackDetail: { feedbackId: string; feedback: DeviceFilteredEscalation };
  GuestHistory: { guestId: string; customerName: string; customerPhone: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const EscalationsScreen: React.FC = () => {
  const [escalations, setEscalations] = useState<DeviceFilteredEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    try {
      // Try to fetch from real API first
      try {
        const response = await axios.get(buildApiUrl(API_ENDPOINTS.ESCALATIONS));
        setEscalations(response.data || []);
      } catch (apiError) {
        console.log('API call failed, using mock data for development');
        
        // Mock escalation data for demonstration
        const mockEscalations: DeviceFilteredEscalation[] = [
          {
            id: '1',
            customerName: 'Rajesh Kumar',
            customerPhone: '+91-9876543210',
            primaryRating: 1.5,
            comments: 'Food was completely cold and the service was very slow. Had to wait 45 minutes for our order.',
            escalationReason: 'Low rating (1.5/5) + keywords: cold, slow',
            createdAt: new Date().toISOString(),
            priority: 'high',
            businessId: 'business-1',
            resolved: false
          },
          {
            id: '2',
            customerName: 'Priya Sharma',
            customerPhone: '+91-8765432109',
            primaryRating: 2.0,
            comments: 'The quality has really gone down. This used to be my favorite place.',
            escalationReason: 'Low rating (2.0/5) + repeat customer concern',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            priority: 'medium',
            businessId: 'business-1',
            resolved: false
          },
          {
            id: '3',
            customerName: 'Amit Patel',
            customerPhone: '+91-7654321098',
            primaryRating: 1.0,
            comments: 'Terrible experience! Wrong order delivered and when called, staff was rude.',
            escalationReason: 'Critical rating (1.0/5) + keywords: terrible, wrong, rude',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            priority: 'high',
            businessId: 'business-1',
            resolved: false
          }
        ];
        
        setEscalations(mockEscalations);
      }
    } catch (error) {
      console.error('Failed to fetch escalations:', error);
      Alert.alert('Error', 'Failed to load escalations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEscalations();
    setRefreshing(false);
  };

  const handleEscalationPress = (escalation: DeviceFilteredEscalation) => {
    navigation.navigate('FeedbackDetail', {
      feedbackId: escalation.id,
      feedback: escalation
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF006E';
      case 'medium':
        return '#FEE440';
      case 'low':
        return '#00F5D4';
      default:
        return '#6B7280';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return '#FF006E';
    if (rating <= 3) return '#FEE440';
    return '#00F5D4';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderEscalation = ({ item }: { item: DeviceFilteredEscalation }) => (
    <TouchableOpacity
      style={styles.escalationCard}
      onPress={() => handleEscalationPress(item)}
      data-testid={`escalation-card-${item.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName} data-testid={`text-customer-name-${item.id}`}>
            {item.customerName}
          </Text>
          <Text style={styles.customerPhone} data-testid={`text-customer-phone-${item.id}`}>
            {item.customerPhone}
          </Text>
        </View>
        <View style={styles.priorityContainer}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText} data-testid={`text-priority-${item.id}`}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.timeText} data-testid={`text-time-${item.id}`}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rating:</Text>
        <Text style={[styles.ratingValue, { color: getRatingColor(item.primaryRating) }]}>
          {item.primaryRating}/5
        </Text>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(item.primaryRating) ? 'star' : 'star-outline'}
              size={16}
              color={star <= Math.round(item.primaryRating) ? '#FEE440' : '#D1D5DB'}
            />
          ))}
        </View>
      </View>

      <Text style={styles.comments} data-testid={`text-comments-${item.id}`} numberOfLines={2}>
        {item.comments}
      </Text>

      <View style={styles.escalationReason}>
        <Ionicons name="warning-outline" size={16} color="#FF006E" />
        <Text style={styles.escalationReasonText} data-testid={`text-reason-${item.id}`}>
          {item.escalationReason}
        </Text>
      </View>

      <View style={styles.actionIndicator}>
        <Ionicons name="chevron-forward" size={20} color="#9B5DE5" />
        <Text style={styles.actionText}>View Details & Resolve</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9B5DE5" />
        <Text style={styles.loadingText}>Loading escalations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9B5DE5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Priority Escalations</Text>
        <Text style={styles.headerSubtitle}>
          {escalations.length} active issue{escalations.length !== 1 ? 's' : ''} requiring attention
        </Text>
      </View>

      {escalations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={80} color="#00F5D4" />
          <Text style={styles.emptyStateTitle}>All Clear!</Text>
          <Text style={styles.emptyStateText}>
            No escalations at the moment. Your customers are happy! 🎉
          </Text>
        </View>
      ) : (
        <FlatList
          data={escalations}
          renderItem={renderEscalation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#9B5DE5']}
              tintColor="#9B5DE5"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#9B5DE5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    opacity: 0.9,
  },
  listContainer: {
    padding: 16,
  },
  escalationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityContainer: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  starContainer: {
    flexDirection: 'row',
  },
  comments: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  escalationReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  escalationReasonText: {
    fontSize: 12,
    color: '#991B1B',
    marginLeft: 6,
    flex: 1,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionText: {
    fontSize: 14,
    color: '#9B5DE5',
    fontWeight: '500',
    marginRight: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EscalationsScreen;