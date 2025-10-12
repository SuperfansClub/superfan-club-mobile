import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_BASE_URL = 'https://56ac3b63-8319-469f-bf69-ed75605af1f3-00-1my3hb9q1uspg.picard.replit.dev'; // Your Replit app URL

export default function QRCodeScreen({ navigation }: any) {
  const [qrData, setQrData] = useState<{ url: string; data: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/restaurant/qr`);
      setQrData(response.data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      Alert.alert('Error', 'Failed to load QR code');
    } finally {
      setLoading(false);
    }
  };

  const shareQRCode = async () => {
    if (!qrData) return;

    try {
      await Share.share({
        message: `Scan this QR code to leave feedback for our restaurant: ${qrData.url}`,
        url: qrData.url,
        title: 'Restaurant Feedback QR Code',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share QR code');
    }
  };

  const downloadQRCode = () => {
    Alert.alert(
      'Download QR Code',
      'To download the QR code for printing, please use the web dashboard on your computer. The QR code image will be available in high resolution for professional printing.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading QR code...</Text>
      </View>
    );
  }

  if (!qrData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="qr-code-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>QR code not available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQRCode}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your QR Code</Text>
        <TouchableOpacity onPress={shareQRCode}>
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={200} color="#3B82F6" />
          </View>
          <Text style={styles.qrDescription}>
            This is your permanent QR code for customer feedback
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to Use:</Text>
          
          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Print this QR code and place it on tables, receipts, or near the exit
            </Text>
          </View>

          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Customers scan the code with their phone camera
            </Text>
          </View>

          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              They fill out a quick feedback form about their experience
            </Text>
          </View>

          <View style={styles.instruction}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>4</Text>
            </View>
            <Text style={styles.instructionText}>
              You get instant notifications for any issues that need attention
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={shareQRCode}>
            <Ionicons name="share-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Share QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={downloadQRCode}>
            <Ionicons name="download-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Download for Print</Text>
          </TouchableOpacity>
        </View>

        {/* QR URL */}
        <View style={styles.urlContainer}>
          <Text style={styles.urlLabel}>Feedback URL:</Text>
          <Text style={styles.urlText}>{qrData.url}</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#3B82F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  qrDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  instruction: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  urlContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urlLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});