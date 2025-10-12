import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

type RootStackParamList = {
  GuestHistory: { guestId: string; customerName: string; customerPhone: string };
};

type GuestHistoryScreenRouteProp = RouteProp<RootStackParamList, 'GuestHistory'>;
type GuestHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GuestHistory'>;

interface Props {
  route: GuestHistoryScreenRouteProp;
  navigation: GuestHistoryScreenNavigationProp;
}

interface HistoryItem {
  id: string;
  createdAt: string;
  primaryRating?: number;
  averageRating: number;
  primaryComment?: string;
  isEscalated: boolean;
  feedbackType: 'inStore' | 'delivery';
  escalationReason?: string;
}

interface GuestStats {
  totalVisits: number;
  averageRating: number;
  totalSpent: number;
  lastVisit: string;
  favoriteItems?: string[];
}

export default function GuestHistoryScreen({ route, navigation }: Props) {
  const { customerName, customerPhone } = route.params;
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchGuestHistory();
  }, []);

  const fetchGuestHistory = async () => {
    try {
      // Fetch guest history based on phone number or name
      const searchParam = customerPhone || customerName;
      
      // Real API call to get guest history
      try {
        const response = await axios.get(buildApiUrl(`/api/feedback/history?phone=${encodeURIComponent(customerPhone || '')}&name=${encodeURIComponent(customerName || '')}`));
        setHistory(response.data.history || []);
        setStats(response.data.stats || null);
      } catch (apiError) {
        console.log('API call failed, using mock data for development');
        // Fallback to mock data for development
        const mockHistory: HistoryItem[] = [
        {
          id: '1',
          createdAt: new Date().toISOString(),
          primaryRating: 2.1,
          averageRating: 2.1,
          primaryComment: "Service was very slow and food was cold when it arrived. Not happy with the quality today.",
          isEscalated: true,
          feedbackType: 'inStore',
          escalationReason: 'Low ratings detected'
        },
        {
          id: '2',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          primaryRating: 4.2,
          averageRating: 4.2,
          primaryComment: "Good food and service. Really enjoyed the butter chicken. Staff was attentive.",
          isEscalated: false,
          feedbackType: 'inStore'
        },
        {
          id: '3',
          createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          primaryRating: 4.8,
          averageRating: 4.8,
          primaryComment: "Excellent experience! Food was perfect and service was prompt. Will definitely come back.",
          isEscalated: false,
          feedbackType: 'inStore'
        },
        {
          id: '4',
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          primaryRating: 4.1,
          averageRating: 4.1,
          primaryComment: "Nice ambiance and good food quality. Slightly slow service but overall satisfied.",
          isEscalated: false,
          feedbackType: 'delivery'
        },
        {
          id: '5',
          createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          primaryRating: 3.8,
          averageRating: 3.8,
          primaryComment: "Decent food. Could improve on spice levels and presentation.",
          isEscalated: false,
          feedbackType: 'inStore'
        }
      ];

      const mockStats: GuestStats = {
        totalVisits: mockHistory.length,
        averageRating: mockHistory.reduce((sum, item) => sum + item.averageRating, 0) / mockHistory.length,
        totalSpent: 2340, // Mock total amount
        lastVisit: mockHistory[0].createdAt,
        favoriteItems: ['Butter Chicken', 'Naan', 'Biryani']
      };

        setHistory(mockHistory);
        setStats(mockStats);
      }

    } catch (error) {
      console.error('Failed to fetch guest history:', error);
      Alert.alert('Error', 'Failed to load guest history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGuestHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={[
      styles.historyCard,
      item.isEscalated && styles.escalatedCard
    ]}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
        <View style={styles.feedbackTypeTag}>
          <Text style={styles.feedbackTypeText}>
            {item.feedbackType === 'inStore' ? 'In-Store' : 'Delivery'}
          </Text>
        </View>
      </View>
      
      <View style={styles.ratingRow}>
        <Text style={styles.starsText}>{getStars(item.averageRating)}</Text>
        <Text style={[styles.ratingValue, { color: getRatingColor(item.averageRating) }]}>
          {item.averageRating.toFixed(1)}/5
        </Text>
        {item.isEscalated && (
          <View style={styles.escalatedBadge}>
            <Text style={styles.escalatedText}>ESCALATED</Text>
          </View>
        )}
      </View>
      
      {item.primaryComment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>"{item.primaryComment}"</Text>
        </View>
      )}
      
      {item.isEscalated && item.escalationReason && (
        <View style={styles.escalationReason}>
          <Ionicons name="warning-outline" size={14} color="#EF4444" />
          <Text style={styles.escalationReasonText}>{item.escalationReason}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#9B5DE5" />
        <Text style={styles.loadingText}>Loading guest history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Guest Info Header */}
      <View style={styles.guestHeader}>
        <View style={styles.guestAvatar}>
          <Text style={styles.guestInitials}>
            {customerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>{customerName}</Text>
          {customerPhone && (
            <Text style={styles.guestPhone}>{customerPhone}</Text>
          )}
          <Text style={styles.guestSince}>
            Customer since {formatDate(stats?.lastVisit || new Date().toISOString())}
          </Text>
        </View>
      </View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalVisits}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getRatingColor(stats.averageRating) }]}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{stats.totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </View>
      )}

      {/* History List */}
      <View style={styles.historySection}>
        <Text style={styles.historySectionTitle}>Feedback History</Text>
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No feedback history found</Text>
              <Text style={styles.emptySubtext}>
                Previous feedback from this customer will appear here
              </Text>
            </View>
          }
        />
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  guestAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9B5DE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  guestInitials: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  guestPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  guestSince: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9B5DE5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  historySection: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 8,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 20,
    paddingBottom: 12,
  },
  historyList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  escalatedCard: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  feedbackTypeTag: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feedbackTypeText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsText: {
    fontSize: 16,
    color: '#FCD34D',
    marginRight: 8,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  escalatedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  escalatedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  commentContainer: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  escalationReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  escalationReasonText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
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
});