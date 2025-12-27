import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import ProductCard from '@/components/ProductCard';

interface ProductRecommendation {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  weight: string | null;
  requiresDrilling: boolean;
  reason: string;
}

interface AssistantResponse {
  transcript: string;
  responseText: string;
  products: ProductRecommendation[];
  sessionId: string;
}

export default function AssistantScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { addItem } = useCart();

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is needed to use the assistant.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('No recording URI');
      }

      // Send to API
      const result = await api.askAudio(uri, sessionId || undefined);
      
      setTranscript(result.transcript);
      setResponse(result);
      setSessionId(result.sessionId);
    } catch (err: any) {
      console.error('Failed to process recording:', err);
      setError(err.message || 'Failed to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePressIn = () => {
    startRecording();
  };

  const handlePressOut = () => {
    if (isRecording) {
      stopRecording();
    }
  };

  const handleAddToCart = (product: ProductRecommendation) => {
    addItem({
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
  };

  const clearSession = () => {
    setSessionId(null);
    setTranscript(null);
    setResponse(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Instructions */}
        {!transcript && !isProcessing && (
          <View style={styles.instructions}>
            <Ionicons name="mic-outline" size={48} color="#9ca3af" />
            <Text style={styles.instructionTitle}>Push to Talk</Text>
            <Text style={styles.instructionText}>
              Press and hold the microphone button to ask about products.
            </Text>
            <Text style={styles.exampleText}>
              Try: "What do you have for hanging a 20 pound picture without drilling?"
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Processing */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.processingText}>Processing your request...</Text>
          </View>
        )}

        {/* Transcript */}
        {transcript && !isProcessing && (
          <View style={styles.transcriptContainer}>
            <View style={styles.transcriptHeader}>
              <Ionicons name="person" size={20} color="#6b7280" />
              <Text style={styles.transcriptLabel}>You asked:</Text>
            </View>
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          </View>
        )}

        {/* Response */}
        {response && !isProcessing && (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Ionicons name="sparkles" size={20} color="#2563eb" />
              <Text style={styles.responseLabel}>Assistant:</Text>
            </View>
            <Text style={styles.responseText}>{response.responseText}</Text>
          </View>
        )}

        {/* Product Recommendations */}
        {response?.products && response.products.length > 0 && !isProcessing && (
          <View style={styles.productsContainer}>
            <Text style={styles.productsTitle}>
              Recommended Products ({response.products.length})
            </Text>
            {response.products.map((product) => (
              <ProductCard
                key={product.sku}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </View>
        )}

        {/* Clear Session Button */}
        {sessionId && !isProcessing && (
          <Pressable style={styles.clearButton} onPress={clearSession}>
            <Ionicons name="refresh" size={16} color="#6b7280" />
            <Text style={styles.clearButtonText}>Start New Conversation</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Push to Talk Button */}
      <View style={styles.micContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording,
              isProcessing && styles.micButtonDisabled,
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isProcessing}
          >
            <Ionicons
              name={isRecording ? 'radio-button-on' : 'mic'}
              size={40}
              color="#fff"
            />
          </Pressable>
        </Animated.View>
        <Text style={styles.micLabel}>
          {isRecording ? 'Release to send' : isProcessing ? 'Processing...' : 'Hold to speak'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  instructions: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 32,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    flex: 1,
    color: '#dc2626',
    fontSize: 14,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 48,
  },
  processingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  transcriptContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  transcriptText: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
  },
  responseContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  responseText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
  },
  productsContainer: {
    marginTop: 8,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginTop: 16,
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  micContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#dc2626',
  },
  micButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  micLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});
