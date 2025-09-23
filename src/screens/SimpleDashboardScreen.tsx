import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';

interface SimpleDashboardScreenProps {
  user: { username: string } | null;
  onLogout: () => void;
}

export default function SimpleDashboardScreen({ user, onLogout }: SimpleDashboardScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Dashboard Cards */}
      <View style={styles.dashboardGrid}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => setCurrentView('escalations')}
        >
          <Text style={styles.cardTitle}>🚨 Escalations</Text>
          <Text style={styles.cardSubtitle}>Priority customer issues</Text>
          <Text style={styles.cardBadge}>3 Active</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => setCurrentView('feedback')}
        >
          <Text style={styles.cardTitle}>📝 Feedback</Text>
          <Text style={styles.cardSubtitle}>Recent customer feedback</Text>
          <Text style={styles.cardBadge}>12 New</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => setCurrentView('analytics')}
        >
          <Text style={styles.cardTitle}>📊 Analytics</Text>
          <Text style={styles.cardSubtitle}>Business insights</Text>
          <Text style={styles.cardBadge}>Updated</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => setCurrentView('settings')}
        >
          <Text style={styles.cardTitle}>⚙️ Settings</Text>
          <Text style={styles.cardSubtitle}>App configuration</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📈 Today's Overview</Text>
        
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>👥</Text>
          <View style={styles.statText}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Customer Interactions</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⭐</Text>
          <View style={styles.statText}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📈</Text>
          <View style={styles.statText}>
            <Text style={styles.statValue}>+12%</Text>
            <Text style={styles.statLabel}>vs Yesterday</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderDetailView = () => (
    <ScrollView style={styles.content}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setCurrentView('dashboard')}
      >
        <Text style={styles.backButtonText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>
          {currentView === 'escalations' && '🚨 Priority Escalations'}
          {currentView === 'feedback' && '📝 Recent Feedback'}
          {currentView === 'analytics' && '📊 Business Analytics'}
          {currentView === 'settings' && '⚙️ Settings'}
        </Text>

        {currentView === 'escalations' && (
          <View>
            <View style={styles.escalationItem}>
              <Text style={styles.escalationTitle}>Urgent: Kitchen Service Issue</Text>
              <Text style={styles.escalationTime}>2 minutes ago</Text>
              <Text style={styles.escalationDescription}>Customer reported long wait times in kitchen</Text>
            </View>
            <View style={styles.escalationItem}>
              <Text style={styles.escalationTitle}>Food Quality Complaint</Text>
              <Text style={styles.escalationTime}>15 minutes ago</Text>
              <Text style={styles.escalationDescription}>Multiple complaints about cold food</Text>
            </View>
          </View>
        )}

        {currentView === 'feedback' && (
          <View>
            <Text style={styles.feedbackItem}>⭐⭐⭐⭐⭐ "Excellent service and food quality!"</Text>
            <Text style={styles.feedbackItem}>⭐⭐⭐⭐ "Great atmosphere, will come back"</Text>
            <Text style={styles.feedbackItem}>⭐⭐⭐ "Food was good but service was slow"</Text>
          </View>
        )}

        {currentView === 'analytics' && (
          <View>
            <Text style={styles.analyticsItem}>📊 Weekly Revenue: $12,450</Text>
            <Text style={styles.analyticsItem}>👥 Customer Count: 156</Text>
            <Text style={styles.analyticsItem}>⭐ Average Rating: 4.8/5</Text>
            <Text style={styles.analyticsItem}>🚨 Escalations: 3 active</Text>
          </View>
        )}

        {currentView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>🔔 Notification Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>🏪 Restaurant Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingText}>👥 Team Management</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {currentView === 'dashboard' ? 'Superfan Club' : 'Details'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.username || 'User'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {currentView === 'dashboard' ? renderDashboard() : renderDetailView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#9B5DE5',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  cardBadge: {
    fontSize: 12,
    color: '#9B5DE5',
    fontWeight: '600',
  },
  statsSection: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  backButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#9B5DE5',
    fontWeight: '600',
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  escalationItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    paddingLeft: 12,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
  },
  escalationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  escalationTime: {
    fontSize: 12,
    color: '#EF4444',
    marginVertical: 4,
  },
  escalationDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  feedbackItem: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  analyticsItem: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  settingItem: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
});