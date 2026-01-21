import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  DATA_POINTS: '@heatmap/data_points',
  SESSIONS: '@heatmap/sessions',
  SETTINGS: '@heatmap/settings',
};

/**
 * Storage utility for persisting heatmap data
 */
export const storage = {
  /**
   * Save data points to storage
   * @param {Array} dataPoints - Array of data points
   */
  async saveDataPoints(dataPoints) {
    try {
      const json = JSON.stringify(dataPoints);
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_POINTS, json);
      return true;
    } catch (error) {
      console.error('Error saving data points:', error);
      return false;
    }
  },

  /**
   * Load data points from storage
   * @returns {Array} Array of data points
   */
  async loadDataPoints() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.DATA_POINTS);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error loading data points:', error);
      return [];
    }
  },

  /**
   * Clear all data points
   */
  async clearDataPoints() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DATA_POINTS);
      return true;
    } catch (error) {
      console.error('Error clearing data points:', error);
      return false;
    }
  },

  /**
   * Save a session with metadata
   * @param {Object} session - Session object with dataPoints and metadata
   */
  async saveSession(session) {
    try {
      const sessions = await this.loadSessions();
      sessions.push({
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...session,
      });
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  /**
   * Load all sessions
   * @returns {Array} Array of sessions
   */
  async loadSessions() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  /**
   * Delete a session by ID
   * @param {number} sessionId - Session ID to delete
   */
  async deleteSession(sessionId) {
    try {
      const sessions = await this.loadSessions();
      const filtered = sessions.filter((s) => s.id !== sessionId);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  },

  /**
   * Save app settings
   * @param {Object} settings - Settings object
   */
  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  /**
   * Load app settings
   * @returns {Object} Settings object
   */
  async loadSettings() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return json ? JSON.parse(json) : getDefaultSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      return getDefaultSettings();
    }
  },

  /**
   * Export data as JSON
   * @param {Array} dataPoints - Data points to export
   * @returns {string} JSON string
   */
  exportAsJSON(dataPoints) {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      version: '1.0',
      dataPoints: dataPoints,
    }, null, 2);
  },

  /**
   * Export data as CSV
   * @param {Array} dataPoints - Data points to export
   * @returns {string} CSV string
   */
  exportAsCSV(dataPoints) {
    const headers = ['id', 'latitude', 'longitude', 'speed', 'timestamp', 'label'];
    const rows = dataPoints.map((point) => [
      point.id,
      point.latitude,
      point.longitude,
      point.speed.toFixed(2),
      point.timestamp,
      point.label || '',
    ]);
    
    return [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');
  },

  /**
   * Export data as GeoJSON for use with mapping tools
   * @param {Array} dataPoints - Data points to export
   * @returns {Object} GeoJSON object
   */
  exportAsGeoJSON(dataPoints) {
    return {
      type: 'FeatureCollection',
      features: dataPoints.map((point) => ({
        type: 'Feature',
        properties: {
          speed: point.speed,
          label: point.label,
          timestamp: point.timestamp,
          color: point.color,
        },
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude],
        },
      })),
    };
  },
};

/**
 * Get default settings
 */
const getDefaultSettings = () => ({
  trackingInterval: 3000,
  distanceInterval: 5,
  enableSpeedTest: false,
  showPath: true,
  circleRadius: 20,
  autoSave: true,
});

export default storage;
