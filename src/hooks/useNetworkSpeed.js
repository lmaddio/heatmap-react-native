import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Multiple test endpoints to avoid 429/409 rate limiting
 * Using various reliable endpoints that respond quickly
 */
const TEST_ENDPOINTS = [
  { url: 'https://www.google.com/generate_204', method: 'GET' },
  { url: 'https://www.gstatic.com/generate_204', method: 'GET' },
  { url: 'https://connectivitycheck.gstatic.com/generate_204', method: 'GET' },
  { url: 'https://www.apple.com/library/test/success.html', method: 'GET' },
  { url: 'https://captive.apple.com/hotspot-detect.html', method: 'GET' },
  { url: 'https://www.msftconnecttest.com/connecttest.txt', method: 'GET' },
  { url: 'https://dns.msftncsi.com/ncsi.txt', method: 'GET' },
  { url: 'https://cloudflare.com/cdn-cgi/trace', method: 'GET' },
  { url: 'https://1.1.1.1/cdn-cgi/trace', method: 'GET' },
  { url: 'https://httpbin.org/get', method: 'GET' },
];

// Track which endpoint to use next (round-robin)
let currentEndpointIndex = 0;

/**
 * Get next test endpoint (round-robin to distribute requests)
 */
const getNextEndpoint = () => {
  const endpoint = TEST_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % TEST_ENDPOINTS.length;
  return endpoint;
};

/**
 * Network speed estimation based on connection type
 */
const estimateSpeedFromConnection = (netInfoState) => {
  if (!netInfoState.isConnected) {
    return 0;
  }

  const { type, details } = netInfoState;
  let baseSpeed = 0;

  switch (type) {
    case 'wifi':
      baseSpeed = 50;
      if (details && details.strength) {
        baseSpeed = (details.strength / 100) * 100;
      }
      break;
    case 'cellular':
      if (details && details.cellularGeneration) {
        switch (details.cellularGeneration) {
          case '5g':
            baseSpeed = 100;
            break;
          case '4g':
            baseSpeed = 35;
            break;
          case '3g':
            baseSpeed = 5;
            break;
          case '2g':
            baseSpeed = 0.5;
            break;
          default:
            baseSpeed = 10;
        }
      } else {
        baseSpeed = 10;
      }
      break;
    case 'ethernet':
      baseSpeed = 100;
      break;
    case 'bluetooth':
      baseSpeed = 2;
      break;
    default:
      baseSpeed = 5;
  }

  // Add realistic variation
  const variation = (Math.random() * 0.4 - 0.2) * baseSpeed;
  return Math.max(0, baseSpeed + variation);
};

/**
 * Perform a latency-based speed test using rotating endpoints
 */
const performLatencyTest = async () => {
  const endpoint = getNextEndpoint();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const startTime = Date.now();
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      cache: 'no-cache',
      mode: 'no-cors', // Avoid CORS issues
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const latency = Date.now() - startTime;

    // Map latency to approximate speed (lower latency = faster connection)
    if (latency < 30) return 100;
    if (latency < 50) return 80;
    if (latency < 80) return 60;
    if (latency < 120) return 45;
    if (latency < 200) return 30;
    if (latency < 350) return 20;
    if (latency < 500) return 12;
    if (latency < 800) return 7;
    if (latency < 1200) return 4;
    return 1;
  } catch (error) {
    // If one endpoint fails, it will automatically use another next time
    console.log(`Speed test failed for ${endpoint.url}:`, error.message);
    return null;
  }
};

/**
 * Perform multiple parallel latency tests for more accurate results
 */
const performMultiLatencyTest = async () => {
  // Test 3 different endpoints simultaneously
  const tests = [
    performLatencyTest(),
    performLatencyTest(),
    performLatencyTest(),
  ];
  
  try {
    const results = await Promise.allSettled(tests);
    const validResults = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);
    
    if (validResults.length === 0) return null;
    
    // Return median of results for stability
    validResults.sort((a, b) => a - b);
    const medianIndex = Math.floor(validResults.length / 2);
    return validResults[medianIndex];
  } catch (error) {
    return null;
  }
};

/**
 * Perform a download-based speed test
 */
const performDownloadTest = async (testUrl, testSizeBytes) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const startTime = Date.now();
    const response = await fetch(testUrl, { 
      cache: 'no-cache',
      signal: controller.signal,
    });
    const data = await response.blob();
    clearTimeout(timeoutId);
    
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const sizeInBits = (data.size || testSizeBytes) * 8;
    const speedMbps = (sizeInBits / durationSeconds) / 1000000;

    return speedMbps;
  } catch (error) {
    return null;
  }
};

/**
 * Custom hook for network speed monitoring
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableSpeedTest - Enable actual speed tests
 * @param {number} options.testInterval - Interval between speed tests (ms)
 * @param {boolean} options.useMultiTest - Use multiple parallel tests for accuracy
 */
export const useNetworkSpeed = (options = {}) => {
  const {
    enableSpeedTest = true,
    testInterval = 1000,
    useMultiTest = false,
  } = options;

  const [speed, setSpeed] = useState(0);
  const [networkType, setNetworkType] = useState('unknown');
  const [isConnected, setIsConnected] = useState(true);
  const [cellularGeneration, setCellularGeneration] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const subscriptionRef = useRef(null);
  const testIntervalRef = useRef(null);

  // Measure network speed
  const measureSpeed = useCallback(async (doSpeedTest = false) => {
    try {
      const netInfo = await NetInfo.fetch();
      setNetworkType(netInfo.type);
      setIsConnected(netInfo.isConnected);
      
      if (netInfo.details && netInfo.details.cellularGeneration) {
        setCellularGeneration(netInfo.details.cellularGeneration);
      }

      let estimatedSpeed = estimateSpeedFromConnection(netInfo);

      // Perform actual speed test
      if (doSpeedTest && netInfo.isConnected) {
        setIsTesting(true);
        
        // Use multi-test for more accuracy or single test for speed
        const latencySpeed = useMultiTest 
          ? await performMultiLatencyTest()
          : await performLatencyTest();
        
        if (latencySpeed !== null) {
          // Blend estimated and tested speeds (70% test, 30% estimate)
          estimatedSpeed = (latencySpeed * 0.7) + (estimatedSpeed * 0.3);
        }
        setIsTesting(false);
      }

      setSpeed(estimatedSpeed);
      return estimatedSpeed;
    } catch (error) {
      console.log('Error measuring speed:', error);
      return 0;
    }
  }, [useMultiTest]);

  // Start monitoring network changes
  const startMonitoring = useCallback(() => {
    // Subscribe to network state changes
    subscriptionRef.current = NetInfo.addEventListener(async (state) => {
      setNetworkType(state.type);
      setIsConnected(state.isConnected);
      
      if (state.details && state.details.cellularGeneration) {
        setCellularGeneration(state.details.cellularGeneration);
      }

      const estimatedSpeed = estimateSpeedFromConnection(state);
      setSpeed(estimatedSpeed);
    });

    // Set up periodic speed tests if enabled
    if (enableSpeedTest) {
      testIntervalRef.current = setInterval(() => {
        measureSpeed(true);
      }, testInterval);
    }
  }, [enableSpeedTest, measureSpeed, testInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    measureSpeed(enableSpeedTest);
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    speed,
    networkType,
    isConnected,
    cellularGeneration,
    isTesting,
    measureSpeed,
    startMonitoring,
    stopMonitoring,
  };
};

export default useNetworkSpeed;
