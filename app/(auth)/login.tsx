/**
 * Login Screen
 * Green/white color scheme with max-width 1200px
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { TEST_CREDENTIALS } from '../../src/services/mockAuth';

const MAX_WIDTH = 1200;
const FORM_MAX_WIDTH = 400;

export default function LoginScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await login({ email: email.trim(), password });
      
      if (response.success) {
        router.replace('/(app)');
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView 
        contentContainerStyle={{ 
          flexGrow: 1,
          alignItems: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View 
          className="flex-1 justify-center px-6 py-12 w-full"
          style={{ maxWidth: MAX_WIDTH }}
        >
          <View 
            className="w-full self-center"
            style={{ maxWidth: FORM_MAX_WIDTH }}
          >
          {/* Header */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">📡</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Welcome Back</Text>
            <Text className="text-base text-gray-500 mt-2">Sign in to Network Heatmap</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6">
              <Text className="text-red-600 text-center font-medium">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-5">
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Email</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-4 text-base bg-white focus:border-green-500"
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isSubmitting}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-4 text-base bg-white focus:border-green-500"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              className={`bg-green-500 rounded-xl py-4 items-center mt-2 ${isSubmitting ? 'opacity-70' : 'active:bg-green-600'}`}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Test Credentials Helper */}
          <TouchableOpacity
            className="mt-6 py-3 items-center"
            onPress={fillTestCredentials}
            disabled={isSubmitting}
          >
            <Text className="text-sm text-gray-500">
              🧪 <Text className="text-green-600 underline font-medium">Use test credentials</Text>
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity disabled={isSubmitting}>
                <Text className="text-green-600 font-bold">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Test Credentials Info */}
          <View className="mt-10 bg-green-50 rounded-xl p-4 border border-green-200">
            <Text className="text-xs text-green-800 text-center font-semibold mb-2">
              🔐 Test Account
            </Text>
            <Text className="text-xs text-green-700 text-center">
              Email: {TEST_CREDENTIALS.email}
            </Text>
            <Text className="text-xs text-green-700 text-center">
              Password: {TEST_CREDENTIALS.password}
            </Text>
          </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
