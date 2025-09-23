import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import DeviceService, { DeviceFilteredEscalation } from '../services/DeviceService';

interface Feedback {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  feedbackType?: string;
  
  // Primary ratings (dynamic system)
  experienceRating?: number;
  overallRating?: number;
  serviceRating?: number;
  qualityRating?: number;
  cleanlinessRating?: number;
  washroomRating?: number;
  staffRating?: number;
  packagingRating?: number;
  deliveryRating?: number;
  driverRating?: number;
  
  // Legacy ratings (for backward compatibility)
  foodQualityRating?: number;
  staffBehaviorRating?: number;
  
  // Comments (dynamic system)
  generalComment?: string;
  comments?: string;
  serviceComment?: string;
  qualityComment?: string;
  cleanlinessComment?: string;
  deliveryComment?: string;
  
  // Images
  imageUrls?: string[];
  imageUrl?: string;
  
  // Escalation
  isEscalated: boolean;
  escalationReason?: string;
  isResolved?: boolean;
  resolutionNotes?: string;
  hasSeriousIssue?: boolean;
  
  // Raw dynamic data
  formData?: { [key: string]: any };
  
  createdAt: string;
}

// Remove hardcoded API URL - using centralized API config instead

type RootStackParamList = {
  FeedbackDetail: { feedbackId: string; feedback: DeviceFilteredEscalation };
  GuestHistory: { guestId: string; customerName: string; customerPhone: string };
};

type FeedbackScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const [feedbacks, setFeedbacks] = useState<DeviceFilteredEscalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [subscriptionSeverity, setSubscriptionSeverity] = useState<string | null>(null);

  useEffect(() => {
    initializeAndFetch();
  }, []);

  const initializeAndFetch = async () => {
    // Check if device is registered
    const isRegistered = await DeviceService.isDeviceRegistered();
    setDeviceRegistered(isRegistered);
    
    if (isRegistered) {
      const severity = await DeviceService.getSubscriptionSeverity();
      setSubscriptionSeverity(severity);
      await fetchDeviceFilteredEscalations();
    } else {
      setLoading(false);
    }
  };

  const fetchDeviceFilteredEscalations = async () => {
    try {
      const escalations = await DeviceService.getDeviceFilteredEscalations();
      setFeedbacks(escalations);
    } catch (error) {
      console.error('Failed to fetch device-filtered escalations:', error);
      Alert.alert(
        'Error', 
        'Failed to load escalations. Please check your device registration.',
        [
          { text: 'OK' },
          { text: 'Register Device', onPress: () => navigateToNotificationSettings() }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigateToNotificationSettings = () => {
    Alert.alert(
      'Device Registration Required',
      'Please go to Settings > Notification Channels to register your device and select priority levels.',
      [{ text: 'OK' }]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (deviceRegistered) {
      fetchDeviceFilteredEscalations();
    } else {
      initializeAndFetch();
    }
  };

  const getAverageRating = (feedback: DeviceFilteredEscalation) => {
    // Use primaryRating if available (from FormConfigV1 summary)
    if (feedback.primaryRating && feedback.primaryRating > 0) {
      return feedback.primaryRating.toFixed(1);
    }
    
    // Fall back to calculating from ratings object
    if (feedback.ratings && typeof feedback.ratings === 'object') {
      const ratingValues = Object.values(feedback.ratings)
        .filter((rating): rating is number => typeof rating === 'number' && rating > 0);
      
      if (ratingValues.length > 0) {
        return (ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length).toFixed(1);
      }
    }
    
    return "0.0";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#10B981';
    if (rating >= 3) return '#F59E0B';
    return '#EF4444';
  };

  const getAvailableRatings = (feedback: DeviceFilteredEscalation) => {
    // Use ratings object from FormConfigV1 summary
    if (feedback.ratings && typeof feedback.ratings === 'object') {
      return Object.entries(feedback.ratings)
        .filter(([_, value]) => typeof value === 'number' && value > 0)
        .slice(0, 5) // Limit to max 5 ratings for mobile display
        .map(([key, value]) => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          value
        }));
    }
    
    return [];
  };

  const getAllComments = (feedback: DeviceFilteredEscalation) => {
    // Use primaryComment if available (from FormConfigV1 summary)
    if (feedback.primaryComment && feedback.primaryComment.trim()) {
      return feedback.primaryComment;
    }
    
    // Fall back to comments object
    if (feedback.comments && typeof feedback.comments === 'object') {
      const commentValues = Object.values(feedback.comments)
        .filter((comment): comment is string => typeof comment === 'string' && comment.trim().length > 0);
      
      if (commentValues.length > 0) {
        return commentValues.join(" | ");
      }
    }
    
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const contactCustomer = (feedback: DeviceFilteredEscalation) => {
    if (!feedback.customerPhone) {
      Alert.alert('No Contact Info', 'Customer did not provide phone number');
      return;
    }

    const phoneNumber = feedback.customerPhone.startsWith('+') 
      ? feedback.customerPhone 
      : `+91${feedback.customerPhone}`;
    
    const customerName = feedback.customerName || 'Valued Customer';
    const defaultMessage = `Dear ${customerName},

Thank you for your feedback about your recent visit to our restaurant. We sincerely apologize for not meeting your expectations.

We take all feedback seriously and would like to make this right. Could we please discuss this further?

Thank you for giving us the opportunity to improve.

Best regards,
Restaurant Management`;

    Alert.alert(
      'Contact Customer',
      `Send WhatsApp message to ${feedback.customerName || 'customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'WhatsApp', 
          onPress: () => {
            const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(defaultMessage)}`;
            Linking.openURL(whatsappUrl).catch(() => {
              Alert.alert('Error', 'Could not open WhatsApp');
            });
          }
        }
      ]
    );
  };

  const renderFeedbackItem = ({ item }: { item: DeviceFilteredEscalation }) => {
    const avgRating = parseFloat(getAverageRating(item));
    
    return (
      <TouchableOpacity 
        style={styles.feedbackCard}
        onPress={() => navigation.navigate('FeedbackDetail', { 
          feedbackId: item.id, 
          feedback: item 
        })}
      >
        <View style={styles.feedbackHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {item.customerName || 'Anonymous Customer'}
            </Text>
            {item.customerPhone && (
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            )}
          </View>
          
          <View style={styles.ratingContainer}>
            <Text style={[styles.rating, { color: getRatingColor(avgRating) }]}>
              {avgRating}
            </Text>
            <Ionicons name="star" size={16} color={getRatingColor(avgRating)} />
          </View>
        </View>

        {item.isEscalated && (
          <View style={[styles.escalationBanner, { 
            backgroundColor: item.severity === 'high' ? '#FEF2F2' : 
                           item.severity === 'medium' ? '#FFFBEB' : '#EBF4FF' 
          }]}>
            <Ionicons 
              name={item.severity === 'high' ? 'alert-circle' : 
                   item.severity === 'medium' ? 'warning' : 'information-circle'} 
              size={16} 
              color={item.severity === 'high' ? '#EF4444' : 
                    item.severity === 'medium' ? '#F59E0B' : '#3B82F6'} 
            />
            <Text style={[styles.escalationText, {
              color: item.severity === 'high' ? '#EF4444' : 
                    item.severity === 'medium' ? '#F59E0B' : '#3B82F6'
            }]}>
              {item.severity?.toUpperCase()} PRIORITY: {item.escalationReason || 'Issue Escalated'}
            </Text>
          </View>
        )}

        <View style={styles.ratingsGrid}>
          {getAvailableRatings(item).map((rating, index) => (
            <View key={`${rating.key}-${index}`} style={styles.ratingItem}>
              <Text style={styles.ratingLabel}>{rating.label}</Text>
              <Text style={styles.ratingValue}>
                {rating.value}/5
              </Text>
            </View>
          ))}
        </View>

        {getAllComments(item) && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentText}>"{getAllComments(item)}"</Text>
          </View>
        )}

        <View style={styles.feedbackFooter}>
          <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
          {item.customerPhone && (
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('GuestHistory', {
                  guestId: item.id,
                  customerName: item.customerName || 'Unknown Customer',
                  customerPhone: item.customerPhone || ''
                });
              }}
            >
              <Ionicons name="time-outline" size={16} color="#9B5DE5" />
              <Text style={[styles.contactText, { color: '#9B5DE5' }]}>History</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading feedback...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!deviceRegistered ? (
        <View style={styles.deviceNotRegisteredContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>Device Not Registered</Text>
          <Text style={styles.emptySubtext}>
            Register your device to receive filtered escalations based on priority levels
          </Text>
          <TouchableOpacity 
            style={styles.registerDeviceButton}
            onPress={navigateToNotificationSettings}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
            <Text style={styles.registerDeviceButtonText}>Register Device</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {subscriptionSeverity && (
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionText}>
                Showing {subscriptionSeverity.toUpperCase()} priority escalations
              </Text>
            </View>
          )}
          <FlatList
            data={feedbacks}
            renderItem={renderFeedbackItem}
            keyExtractor={(item: DeviceFilteredEscalation) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No {subscriptionSeverity} priority escalations</Text>
                <Text style={styles.emptySubtext}>
                  Escalations matching your subscription level will appear here
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
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
  listContainer: {
    padding: 16,
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  escalationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  escalationText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  ratingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  feedbackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contactText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  deviceNotRegisteredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  registerDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9B5DE5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  registerDeviceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  subscriptionHeader: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});