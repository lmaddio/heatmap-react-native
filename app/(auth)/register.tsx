/**
 * Register Screen
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

const MAX_WIDTH = 1200;
const FORM_MAX_WIDTH = 400;

export default function RegisterScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    setError(null);
    
    // Client-side validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      
      if (response.success) {
        router.replace('/(app)');
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
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
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">🚀</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
            <Text className="text-base text-gray-500 mt-2">Join Network Heatmap</Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-300 rounded-xl p-4 mb-6">
              <Text className="text-red-600 text-center font-medium">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Full Name</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-4 text-base bg-white focus:border-green-500"
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>

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
                placeholder="Create a password (min 6 characters)"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>

            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Confirm Password</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-4 text-base bg-white focus:border-green-500"
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              className={`bg-green-500 rounded-xl py-4 items-center mt-2 ${isSubmitting ? 'opacity-70' : 'active:bg-green-600'}`}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity disabled={isSubmitting}>
                <Text className="text-green-600 font-bold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Info */}
          <View className="mt-8 bg-green-50 rounded-xl p-4 border border-green-200">
            <Text className="text-xs text-green-700 text-center">
              ℹ️ This is a demo app. Your data is stored locally for testing purposes only.
            </Text>
          </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
