import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DataPoint,
  Session,
  AppSettings,
  ExportedData,
  GeoJSONFeatureCollection,
} from '../types';

const STORAGE_KEYS = {
  DATA_POINTS: '@heatmap/data_points',
  SESSIONS: '@heatmap/sessions',
  SETTINGS: '@heatmap/settings',
} as const;

/**
 * Get default settings
 */
const getDefaultSettings = (): AppSettings => ({
  trackingInterval: 3000,
  distanceInterval: 5,
  enableSpeedTest: false,
  showPath: true,
  circleRadius: 20,
  autoSave: true,
});

/**
 * Storage utility for persisting heatmap data
 */
export const storage = {
  /**
   * Save data points to storage
   */
  async saveDataPoints(dataPoints: DataPoint[]): Promise<boolean> {
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
   */
  async loadDataPoints(): Promise<DataPoint[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.DATA_POINTS);
      return json ? (JSON.parse(json) as DataPoint[]) : [];
    } catch (error) {
      console.error('Error loading data points:', error);
      return [];
    }
  },

  /**
   * Clear all data points
   */
  async clearDataPoints(): Promise<boolean> {
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
   */
  async saveSession(session: Omit<Session, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const sessions = await this.loadSessions();
      const newSession: Session = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...session,
      };
      sessions.push(newSession);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  /**
   * Load all sessions
   */
  async loadSessions(): Promise<Session[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return json ? (JSON.parse(json) as Session[]) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  /**
   * Delete a session by ID
   */
  async deleteSession(sessionId: number): Promise<boolean> {
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
   */
  async saveSettings(settings: AppSettings): Promise<boolean> {
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
   */
  async loadSettings(): Promise<AppSettings> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return json ? (JSON.parse(json) as AppSettings) : getDefaultSettings();
    } catch (error) {
      console.error('Error loading settings:', error);
      return getDefaultSettings();
    }
  },

  /**
   * Export data as JSON
   */
  exportAsJSON(dataPoints: DataPoint[]): string {
    const exportData: ExportedData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      dataPoints: dataPoints,
    };
    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Export data as CSV
   */
  exportAsCSV(dataPoints: DataPoint[]): string {
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
   */
  exportAsGeoJSON(dataPoints: DataPoint[]): GeoJSONFeatureCollection {
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

export default storage;
