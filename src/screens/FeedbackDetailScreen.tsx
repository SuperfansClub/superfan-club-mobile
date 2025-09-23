import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { DeviceFilteredEscalation } from '../services/DeviceService';

type RootStackParamList = {
  FeedbackDetail: { feedbackId: string; feedback: DeviceFilteredEscalation };
  GuestHistory: { guestId: string; customerName: string; customerPhone: string };
};

type FeedbackDetailScreenRouteProp = RouteProp<RootStackParamList, 'FeedbackDetail'>;
type FeedbackDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FeedbackDetail'>;

interface Props {
  route: FeedbackDetailScreenRouteProp;
  navigation: FeedbackDetailScreenNavigationProp;
}

interface ResolutionStep {
  step: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export default function FeedbackDetailScreen({ route, navigation }: Props) {
  const { feedback } = route.params;
  const [resolutionSteps, setResolutionSteps] = useState<ResolutionStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    generateResolutionSteps();
  }, []);

  const generateResolutionSteps = async () => {
    try {
      // Generate AI-powered resolution steps based on feedback
      const steps: ResolutionStep[] = [
        {
          step: 1,
          description: "Immediately apologize to the customer for the poor experience and acknowledge their concerns about service quality.",
          priority: 'high'
        },
        {
          step: 2,
          description: feedback.primaryRating && feedback.primaryRating <= 2 
            ? "Offer a complimentary meal or full refund for today's order to demonstrate commitment to customer satisfaction."
            : "Offer a discount on their next visit or a complimentary item to encourage return.",
          priority: 'high'
        },
        {
          step: 3,
          description: "Review operational procedures that led to this issue and implement immediate corrective measures.",
          priority: 'medium'
        },
        {
          step: 4,
          description: "Follow up with a personal call or message within 24 hours to ensure the customer feels valued.",
          priority: 'medium'
        }
      ];

      setResolutionSteps(steps);
    } catch (error) {
      console.error('Failed to generate resolution steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (feedback.primaryRating && feedback.primaryRating > 0) {
      return feedback.primaryRating.toFixed(1);
    }
    
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

  const getStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const contactCustomer = () => {
    if (!feedback.customerPhone) {
      Alert.alert('No Contact Info', 'Customer did not provide phone number');
      return;
    }

    const phoneNumber = feedback.customerPhone.startsWith('+') 
      ? feedback.customerPhone 
      : `+91${feedback.customerPhone}`;
    
    const customerName = feedback.customerName || 'Valued Customer';
    const defaultMessage = `Dear ${customerName},

Thank you for your feedback about your recent visit. We sincerely apologize for not meeting your expectations and take your concerns seriously.

We would like to make this right and discuss how we can improve your experience. Could we please speak with you?

Thank you for giving us the opportunity to serve you better.

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

  const markResolved = async () => {
    Alert.alert(
      'Mark as Resolved',
      'Are you sure you want to mark this feedback as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Resolved', 
          onPress: async () => {
            setResolving(true);
            try {
              await axios.patch(buildApiUrl(`/api/feedback/${feedback.id}/resolve`), {
                resolutionNotes: 'Resolved via mobile app',
                resolvedAt: new Date().toISOString()
              });
              
              Alert.alert(
                'Feedback Resolved',
                'The feedback has been marked as resolved. Customer will be notified.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to mark feedback as resolved');
            } finally {
              setResolving(false);
            }
          }
        }
      ]
    );
  };

  const viewGuestHistory = () => {
    if (feedback.customerName || feedback.customerPhone) {
      navigation.navigate('GuestHistory', {
        guestId: feedback.id,
        customerName: feedback.customerName || 'Unknown Customer',
        customerPhone: feedback.customerPhone || ''
      });
    } else {
      Alert.alert('No Customer Info', 'Cannot view history without customer details');
    }
  };

  const avgRating = parseFloat(getAverageRating());

  return (
    <ScrollView style={styles.container}>
      {/* Customer Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" size={20} color="#9B5DE5" />
          <Text style={styles.sectionTitle}>Customer Information</Text>
        </View>
        
        <View style={styles.customerCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitials}>
              {(feedback.customerName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>
              {feedback.customerName || 'Anonymous Customer'}
            </Text>
            {feedback.customerPhone && (
              <Text style={styles.customerPhone}>{feedback.customerPhone}</Text>
            )}
            <Text style={styles.visitInfo}>
              {formatDate(feedback.createdAt)}
            </Text>
          </View>
          <TouchableOpacity style={styles.historyButton} onPress={viewGuestHistory}>
            <Ionicons name="time-outline" size={16} color="#9B5DE5" />
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rating & Feedback */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Rating & Feedback</Text>
        </View>
        
        <View style={styles.ratingDisplay}>
          <Text style={styles.starsText}>{getStars(avgRating)}</Text>
          <Text style={[styles.ratingValue, { color: getRatingColor(avgRating) }]}>
            {avgRating} out of 5
          </Text>
        </View>

        {feedback.isEscalated && (
          <View style={[styles.escalationBanner, { 
            backgroundColor: feedback.severity === 'high' ? '#FEF2F2' : 
                           feedback.severity === 'medium' ? '#FFFBEB' : '#EBF4FF' 
          }]}>
            <Ionicons 
              name={feedback.severity === 'high' ? 'alert-circle' : 
                   feedback.severity === 'medium' ? 'warning' : 'information-circle'} 
              size={16} 
              color={feedback.severity === 'high' ? '#EF4444' : 
                    feedback.severity === 'medium' ? '#F59E0B' : '#3B82F6'} 
            />
            <Text style={[styles.escalationText, {
              color: feedback.severity === 'high' ? '#EF4444' : 
                    feedback.severity === 'medium' ? '#F59E0B' : '#3B82F6'
            }]}>
              {feedback.severity?.toUpperCase()} PRIORITY: {feedback.escalationReason || 'Issue Escalated'}
            </Text>
          </View>
        )}

        {feedback.primaryComment && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentText}>"{feedback.primaryComment}"</Text>
          </View>
        )}

        {/* Individual Ratings */}
        {feedback.ratings && typeof feedback.ratings === 'object' && (
          <View style={styles.individualRatings}>
            {Object.entries(feedback.ratings)
              .filter(([_, value]) => typeof value === 'number' && value > 0)
              .map(([key, value], index) => (
                <View key={`${key}-${index}`} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text style={styles.ratingRowValue}>{value}/5</Text>
                </View>
              ))}
          </View>
        )}
      </View>

      {/* AI Resolution Steps */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={20} color="#00F5D4" />
          <Text style={styles.sectionTitle}>AI Resolution Steps</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="small" color="#9B5DE5" />
        ) : (
          <View style={styles.resolutionSteps}>
            {resolutionSteps.map((step) => (
              <View key={step.step} style={styles.resolutionStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.step}</Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {feedback.customerPhone && (
          <TouchableOpacity style={styles.contactButton} onPress={contactCustomer}>
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text style={styles.contactButtonText}>Contact Customer</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.resolveButton, resolving && styles.resolveButtonDisabled]} 
          onPress={markResolved}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="white" />
          )}
          <Text style={styles.resolveButtonText}>
            {resolving ? 'Resolving...' : 'Mark Resolved'}
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
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9B5DE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  visitInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyButtonText: {
    color: '#9B5DE5',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  starsText: {
    fontSize: 24,
    color: '#FCD34D',
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  escalationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  escalationText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  commentContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  commentText: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  individualRatings: {
    marginTop: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  ratingRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  resolutionSteps: {
    marginTop: 8,
  },
  resolutionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9B5DE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 12,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resolveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B5DE5',
    paddingVertical: 14,
    borderRadius: 12,
  },
  resolveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  resolveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});