/**
 * Mock Authentication Service
 * Simulates server responses for testing purposes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

// Storage keys
const AUTH_TOKEN_KEY = '@heatmap/auth_token';
const USER_KEY = '@heatmap/user';

// Mock user database (simulates server-side storage)
const MOCK_USERS: Map<string, { user: User; password: string }> = new Map();

// Pre-populate with a test user
const TEST_USER: User = {
  id: 'test-user-001',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date().toISOString(),
};

// Initialize mock database with test user
MOCK_USERS.set('test@example.com', {
  user: TEST_USER,
  password: 'password123', // Test password
});

/**
 * Simulate network delay
 */
const simulateDelay = (ms: number = 800): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate a mock JWT token
 */
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: userId, 
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }));
  const signature = btoa('mock-signature-' + userId);
  return `${header}.${payload}.${signature}`;
};

/**
 * Mock Login API
 */
export const mockLogin = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  await simulateDelay();
  
  const { email, password } = credentials;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email format',
    };
  }
  
  // Check if user exists
  const userData = MOCK_USERS.get(email.toLowerCase());
  if (!userData) {
    return {
      success: false,
      error: 'No account found with this email',
    };
  }
  
  // Verify password
  if (userData.password !== password) {
    return {
      success: false,
      error: 'Incorrect password',
    };
  }
  
  // Generate token and store session
  const token = generateMockToken(userData.user.id);
  
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData.user));
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
  
  return {
    success: true,
    user: userData.user,
    token,
  };
};

/**
 * Mock Register API
 */
export const mockRegister = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  await simulateDelay();
  
  const { name, email, password, confirmPassword } = credentials;
  
  // Validate name
  if (!name || name.trim().length < 2) {
    return {
      success: false,
      error: 'Name must be at least 2 characters',
    };
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Invalid email format',
    };
  }
  
  // Check if email already exists
  if (MOCK_USERS.has(email.toLowerCase())) {
    return {
      success: false,
      error: 'An account with this email already exists',
    };
  }
  
  // Validate password
  if (password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters',
    };
  }
  
  // Confirm passwords match
  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match',
    };
  }
  
  // Create new user
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  
  // Store in mock database
  MOCK_USERS.set(email.toLowerCase(), {
    user: newUser,
    password,
  });
  
  // Generate token and store session
  const token = generateMockToken(newUser.id);
  
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
  
  return {
    success: true,
    user: newUser,
    token,
  };
};

/**
 * Mock Logout API
 */
export const mockLogout = async (): Promise<void> => {
  await simulateDelay(300);
  
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

/**
 * Get stored user session
 */
export const getStoredSession = async (): Promise<{ user: User; token: string } | null> => {
  try {
    const [token, userJson] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    
    if (token && userJson) {
      const user = JSON.parse(userJson) as User;
      return { user, token };
    }
  } catch (error) {
    console.error('Failed to get stored session:', error);
  }
  
  return null;
};

/**
 * Check if token is valid (mock validation)
 */
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
};

// Export test credentials for documentation
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123',
};
