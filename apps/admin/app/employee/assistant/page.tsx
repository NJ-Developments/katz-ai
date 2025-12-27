'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { askAssistant, addToCart, getCart } from '@/lib/api';
import {
  Mic,
  MicOff,
  Send,
  ShoppingCart,
  MapPin,
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Home,
  Volume2,
  VolumeX,
  AlertCircle,
} from 'lucide-react';

interface ProductCard {
  sku: string;
  name: string;
  price: number;
  stock: number;
  location: string;
  whyItWorks: string;
  attributes: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductCard[];
  safetyNotes?: string[];
  followUpQuestions?: string[];
  timestamp: Date;
}

// Check for Web Speech API support
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 
  'speechSynthesis' in window;

export default function EmployeeAssistantPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice output state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          
          setInputText(transcript);
          
          // If final result, auto-send
          if (event.results[0].isFinal) {
            setIsListening(false);
            // Small delay to show final transcript before sending
            setTimeout(() => {
              if (transcript.trim()) {
                handleSendMessageDirect(transcript.trim());
              }
            }, 300);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please enable it in your browser settings.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Redirect if not logged in or if not employee
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'EMPLOYEE') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load cart count
  useEffect(() => {
    if (token) {
      loadCartCount();
    }
  }, [token]);

  async function loadCartCount() {
    try {
      const cart = await getCart(token!);
      setCartCount(cart?.items?.length || 0);
    } catch (e) {
      // Cart might not exist yet
    }
  }

  // Text-to-speech function
  const speakText = useCallback((text: string) => {
    if (!isSpeechSynthesisSupported || !ttsEnabled) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // Toggle microphone
  function toggleListening() {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      setInputText('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }

  // Toggle TTS
  function toggleTTS() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setTtsEnabled(!ttsEnabled);
  }

  // Direct send (used by speech recognition callback)
  async function handleSendMessageDirect(messageText: string) {
    if (!messageText || isLoading) return;

    setError(null);

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await askAssistant(token!, {
        transcript: messageText,
        conversationId: conversationId || undefined,
      });

      setConversationId(response.conversationId);

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.assistantMessage,
        products: response.recommendedItems,
        safetyNotes: response.safetyNotes,
        followUpQuestions: response.followUpQuestions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak the response if TTS enabled
      if (ttsEnabled && response.assistantMessage) {
        speakText(response.assistantMessage);
      }
    } catch (error: any) {
      console.error('Assistant error:', error);
      const errorMsg = error.message || 'Failed to get response';
      
      if (errorMsg.includes('AI not configured') || errorMsg.includes('GEMINI_API_KEY')) {
        setError('AI is not configured. Please add GEMINI_API_KEY to environment variables.');
      } else {
        setError(errorMsg);
      }

      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm having trouble right now. Please try again or ask a store associate for help.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(text?: string) {
    const messageText = text || inputText.trim();
    handleSendMessageDirect(messageText);
  }

  async function handleAddToCart(product: ProductCard) {
    try {
      await addToCart(token!, { sku: product.sku, quantity: 1 });
      setCartCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user || user.role !== 'EMPLOYEE') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/employee')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Customer Help</h1>
            <p className="text-xs text-gray-500">{user.storeName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* TTS Toggle */}
          {isSpeechSynthesisSupported && (
            <button
              onClick={toggleTTS}
              className={`p-2 rounded-lg transition-colors ${
                ttsEnabled 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isSpeaking ? 'animate-pulse' : ''}`}
              title={ttsEnabled ? 'Voice output ON' : 'Voice output OFF'}
            >
              {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={() => router.push('/employee')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Home"
          >
            <Home className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push('/employee/cart')}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              How can I help this customer?
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Tap the mic and speak, or type below. I only recommend items we have in stock!
            </p>
            {!speechSupported && (
              <p className="text-amber-600 text-sm mt-2">
                Voice input not supported in this browser. Use text input instead.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'I need to hang a heavy mirror',
                'What hooks work without drilling?',
                'TV mounting hardware for drywall',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white rounded-2xl rounded-br-md px-4 py-3'
                    : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm'
                }`}
              >
                <p className={message.role === 'user' ? 'text-white' : 'text-gray-800'}>
                  {message.content}
                </p>

                {/* Safety Notes */}
                {message.safetyNotes && message.safetyNotes.length > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        {message.safetyNotes.map((note, i) => (
                          <p key={i}>{note}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Cards */}
                {message.products && message.products.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-600">Recommended Products:</p>
                    {message.products.map((product) => (
                      <div
                        key={product.sku}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary-600">
                              ${product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">{product.stock} in stock</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {product.location}
                        </div>
                        {product.whyItWorks && (
                          <p className="mt-2 text-sm text-gray-600 italic">
                            "{product.whyItWorks}"
                          </p>
                        )}
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="mt-3 w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Questions */}
                {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-600">You might also ask:</p>
                    {message.followUpQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(question)}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Listening indicator */}
        {isListening && (
          <div className="flex justify-center">
            <div className="bg-primary-100 border border-primary-200 rounded-full px-4 py-2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
              <span className="text-primary-700 font-medium">Listening...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          {/* Big Mic Button */}
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={isLoading}
              className={`p-4 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse scale-110'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
          )}
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? 'Listening...' : 'Type or tap mic to speak...'}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={isLoading || isListening}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
