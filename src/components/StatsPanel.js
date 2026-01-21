import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateStats, getSpeedColor, MAX_SPEED } from '../utils/heatmapUtils';

/**
 * StatsPanel component - displays statistics with gradient visualization
 */
const StatsPanel = ({ dataPoints }) => {
  const stats = calculateStats(dataPoints);

  // Calculate speed distribution for histogram
  const histogram = useMemo(() => {
    if (dataPoints.length === 0) return [];
    
    const buckets = 10;
    const distribution = new Array(buckets).fill(0);
    
    dataPoints.forEach(point => {
      const bucketIndex = Math.min(
        Math.floor((point.speed / MAX_SPEED) * buckets),
        buckets - 1
      );
      distribution[bucketIndex]++;
    });
    
    const maxCount = Math.max(...distribution, 1);
    return distribution.map((count, index) => ({
      count,
      height: (count / maxCount) * 100,
      speed: ((index + 0.5) / buckets) * MAX_SPEED,
      color: getSpeedColor(((index + 0.5) / buckets) * MAX_SPEED, 1),
    }));
  }, [dataPoints]);

  if (stats.count === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No data collected yet. Start tracking to collect network speed data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.count}</Text>
          <Text style={styles.statLabel}>Data Points</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getSpeedColor(stats.average, 1) }]}>
            {stats.average.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Avg Speed</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getSpeedColor(stats.max, 1) }]}>
            {stats.max.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Max Speed</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getSpeedColor(stats.min, 1) }]}>
            {stats.min.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Min Speed</Text>
        </View>
      </View>

      {/* Speed Distribution Histogram */}
      <View style={styles.histogramSection}>
        <Text style={styles.histogramTitle}>Speed Distribution</Text>
        <View style={styles.histogram}>
          {histogram.map((bar, index) => (
            <View key={index} style={styles.histogramBarContainer}>
              <View style={styles.histogramBarWrapper}>
                <View 
                  style={[
                    styles.histogramBar, 
                    { 
                      height: `${Math.max(bar.height, 2)}%`,
                      backgroundColor: bar.color,
                    }
                  ]} 
                />
              </View>
              {index % 2 === 0 && (
                <Text style={styles.histogramLabel}>
                  {Math.round(bar.speed)}
                </Text>
              )}
            </View>
          ))}
        </View>
        <Text style={styles.histogramAxisLabel}>Speed (Mbps)</Text>
      </View>

      {/* Coverage breakdown with gradient */}
      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Coverage Quality</Text>
        <View style={styles.breakdownBar}>
          {stats.excellent > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.excellent, backgroundColor: getSpeedColor(75, 1) },
              ]}
            />
          )}
          {stats.good > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.good, backgroundColor: getSpeedColor(35, 1) },
              ]}
            />
          )}
          {stats.fair > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.fair, backgroundColor: getSpeedColor(15, 1) },
              ]}
            />
          )}
          {(stats.poor + stats.veryPoor) > 0 && (
            <View
              style={[
                styles.breakdownSegment,
                { flex: stats.poor + stats.veryPoor, backgroundColor: getSpeedColor(3, 1) },
              ]}
            />
          )}
        </View>
        <View style={styles.breakdownLabels}>
          <View style={styles.breakdownLabelItem}>
            <View style={[styles.breakdownDot, { backgroundColor: getSpeedColor(75, 1) }]} />
            <Text style={styles.breakdownLabel}>Excellent: {stats.excellent}</Text>
          </View>
          <View style={styles.breakdownLabelItem}>
            <View style={[styles.breakdownDot, { backgroundColor: getSpeedColor(35, 1) }]} />
            <Text style={styles.breakdownLabel}>Good: {stats.good}</Text>
          </View>
          <View style={styles.breakdownLabelItem}>
            <View style={[styles.breakdownDot, { backgroundColor: getSpeedColor(15, 1) }]} />
            <Text style={styles.breakdownLabel}>Fair: {stats.fair}</Text>
          </View>
          <View style={styles.breakdownLabelItem}>
            <View style={[styles.breakdownDot, { backgroundColor: getSpeedColor(3, 1) }]} />
            <Text style={styles.breakdownLabel}>Poor: {stats.poor + stats.veryPoor}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statItem: {
    width: '25%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  histogramSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  histogramTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  histogram: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'flex-end',
  },
  histogramBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  histogramBarWrapper: {
    flex: 1,
    width: '80%',
    justifyContent: 'flex-end',
  },
  histogramBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 2,
  },
  histogramLabel: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
  histogramAxisLabel: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  breakdown: {
    paddingTop: 0,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  breakdownLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 4,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#666',
  },
});

export default StatsPanel;
