import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

interface GuestSummary {
  id: string;
  customerName: string;
  customerPhone: string;
  totalVisits: number;
  averageRating: number;
  lastVisit: string;
  totalSpent?: number;
  favoriteItems?: string[];
  status: 'superfan' | 'regular' | 'at-risk' | 'new';
}

type RootStackParamList = {
  GuestHistory: { guestId: string; customerName: string; customerPhone: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const GuestHistoryListScreen: React.FC = () => {
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchGuests();
  }, []);

  useEffect(() => {
    filterGuests();
  }, [searchQuery, guests]);

  const fetchGuests = async () => {
    try {
      // Try to fetch from real API first
      try {
        const response = await axios.get(buildApiUrl('/api/guests'));
        setGuests(response.data || []);
      } catch (apiError) {
        console.log('API call failed, using mock data for development');
        
        // Mock guest data for demonstration
        const mockGuests: GuestSummary[] = [
          {
            id: '1',
            customerName: 'Rajesh Kumar',
            customerPhone: '+91-9876543210',
            totalVisits: 12,
            averageRating: 4.2,
            lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpent: 2400,
            favoriteItems: ['Butter Chicken', 'Naan'],
            status: 'superfan'
          },
          {
            id: '2',
            customerName: 'Priya Sharma',
            customerPhone: '+91-8765432109',
            totalVisits: 8,
            averageRating: 3.8,
            lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpent: 1600,
            favoriteItems: ['Paneer Tikka', 'Dal Makhani'],
            status: 'regular'
          },
          {
            id: '3',
            customerName: 'Amit Patel',
            customerPhone: '+91-7654321098',
            totalVisits: 3,
            averageRating: 2.1,
            lastVisit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpent: 900,
            favoriteItems: ['Biryani'],
            status: 'at-risk'
          },
          {
            id: '4',
            customerName: 'Sunita Singh',
            customerPhone: '+91-6543210987',
            totalVisits: 15,
            averageRating: 4.8,
            lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            totalSpent: 3200,
            favoriteItems: ['Tandoori Chicken', 'Garlic Naan', 'Lassi'],
            status: 'superfan'
          },
          {
            id: '5',
            customerName: 'Vikram Gupta',
            customerPhone: '+91-5432109876',
            totalVisits: 1,
            averageRating: 4.5,
            lastVisit: new Date().toISOString(),
            totalSpent: 450,
            favoriteItems: ['Chole Bhature'],
            status: 'new'
          }
        ];
        
        setGuests(mockGuests);
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error);
      Alert.alert('Error', 'Failed to load guest data');
    } finally {
      setLoading(false);
    }
  };

  const filterGuests = () => {
    if (!searchQuery.trim()) {
      setFilteredGuests(guests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = guests.filter(
      guest =>
        guest.customerName.toLowerCase().includes(query) ||
        guest.customerPhone.includes(query)
    );
    setFilteredGuests(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGuests();
    setRefreshing(false);
  };

  const handleGuestPress = (guest: GuestSummary) => {
    navigation.navigate('GuestHistory', {
      guestId: guest.id,
      customerName: guest.customerName,
      customerPhone: guest.customerPhone
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'superfan':
        return '#9B5DE5';
      case 'regular':
        return '#00F5D4';
      case 'at-risk':
        return '#FF006E';
      case 'new':
        return '#FEE440';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'superfan':
        return 'star';
      case 'regular':
        return 'heart';
      case 'at-risk':
        return 'warning';
      case 'new':
        return 'person-add';
      default:
        return 'person';
    }
  };

  const formatLastVisit = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderGuest = ({ item }: { item: GuestSummary }) => (
    <TouchableOpacity
      style={styles.guestCard}
      onPress={() => handleGuestPress(item)}
      data-testid={`guest-card-${item.id}`}
    >
      <View style={styles.cardHeader}>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName} data-testid={`text-guest-name-${item.id}`}>
            {item.customerName}
          </Text>
          <Text style={styles.guestPhone} data-testid={`text-guest-phone-${item.id}`}>
            {item.customerPhone}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color="#FFFFFF" 
            style={{ marginRight: 4 }} 
          />
          <Text style={styles.statusText} data-testid={`text-status-${item.id}`}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue} data-testid={`text-visits-${item.id}`}>
            {item.totalVisits}
          </Text>
          <Text style={styles.statLabel}>Visits</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: item.averageRating >= 4 ? '#00F5D4' : item.averageRating >= 3 ? '#FEE440' : '#FF006E' }]}>
            {item.averageRating.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        {item.totalSpent && (
          <View style={styles.statItem}>
            <Text style={styles.statValue} data-testid={`text-spent-${item.id}`}>
              ₹{item.totalSpent}
            </Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        )}
      </View>

      {item.favoriteItems && item.favoriteItems.length > 0 && (
        <View style={styles.favoritesContainer}>
          <Text style={styles.favoritesLabel}>Favorite Items:</Text>
          <Text style={styles.favoriteItems} data-testid={`text-favorites-${item.id}`}>
            {item.favoriteItems.slice(0, 2).join(', ')}
            {item.favoriteItems.length > 2 ? ` +${item.favoriteItems.length - 2} more` : ''}
          </Text>
        </View>
      )}

      <View style={styles.lastVisitContainer}>
        <Text style={styles.lastVisitLabel}>Last Visit:</Text>
        <Text style={styles.lastVisitText} data-testid={`text-last-visit-${item.id}`}>
          {formatLastVisit(item.lastVisit)}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#9B5DE5" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#9B5DE5" />
        <Text style={styles.loadingText}>Loading guest history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9B5DE5" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guest History</Text>
        <Text style={styles.headerSubtitle}>
          {guests.length} customer{guests.length !== 1 ? 's' : ''} in your database
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone number"
          value={searchQuery}
          onChangeText={setSearchQuery}
          data-testid="input-search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            data-testid="button-clear-search"
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {filteredGuests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'No Results Found' : 'No Guest Data'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Guest history will appear here as customers provide feedback'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGuests}
          renderItem={renderGuest}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  guestCard: {
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
    marginBottom: 16,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  guestPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  favoritesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  favoritesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    marginBottom: 4,
  },
  favoriteItems: {
    fontSize: 14,
    color: '#B45309',
  },
  lastVisitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastVisitLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  lastVisitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
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

export default GuestHistoryListScreen;