import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { getSpeedColor, MAX_SPEED } from '../utils/heatmapUtils';

/**
 * Legend component - shows smooth gradient speed legend
 */
const Legend = ({ collapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Generate gradient colors for the legend bar
  const gradientColors = useMemo(() => {
    const colors = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const speed = (i / steps) * MAX_SPEED;
      colors.push(getSpeedColor(speed, 1));
    }
    return colors;
  }, []);

  // Speed markers for the legend
  const speedMarkers = [
    { speed: 0, label: '0' },
    { speed: 10, label: '10' },
    { speed: 25, label: '25' },
    { speed: 50, label: '50' },
    { speed: 100, label: '100' },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>Network Speed (Mbps)</Text>
        <Text style={styles.toggleIcon}>{isCollapsed ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.content}>
          {/* Gradient bar */}
          <View style={styles.gradientContainer}>
            <View style={styles.gradientBar}>
              {gradientColors.map((color, index) => (
                <View
                  key={index}
                  style={[
                    styles.gradientSegment,
                    { 
                      backgroundColor: color,
                      width: `${100 / gradientColors.length}%`,
                    },
                  ]}
                />
              ))}
            </View>
            
            {/* Speed markers */}
            <View style={styles.markersContainer}>
              {speedMarkers.map((marker, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.markerItem,
                    { left: `${(marker.speed / MAX_SPEED) * 100}%` },
                  ]}
                >
                  <View style={styles.markerTick} />
                  <Text style={styles.markerLabel}>{marker.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Speed quality labels */}
          <View style={styles.labelsRow}>
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: getSpeedColor(0, 1) }]} />
              <Text style={styles.labelText}>Poor</Text>
            </View>
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: getSpeedColor(15, 1) }]} />
              <Text style={styles.labelText}>Fair</Text>
            </View>
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: getSpeedColor(35, 1) }]} />
              <Text style={styles.labelText}>Good</Text>
            </View>
            <View style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: getSpeedColor(75, 1) }]} />
              <Text style={styles.labelText}>Excellent</Text>
            </View>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            Colors represent real-time network speed at each location
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  toggleIcon: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gradientContainer: {
    marginBottom: 12,
  },
  gradientBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  gradientSegment: {
    height: '100%',
  },
  markersContainer: {
    position: 'relative',
    height: 24,
    marginTop: 4,
  },
  markerItem: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -10 }],
  },
  markerTick: {
    width: 1,
    height: 6,
    backgroundColor: '#999',
  },
  markerLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  labelText: {
    fontSize: 11,
    color: '#666',
  },
  infoText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default Legend;
