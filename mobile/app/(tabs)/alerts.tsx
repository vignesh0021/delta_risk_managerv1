import { View, Text, ScrollView, StyleSheet, useState, useEffect } from 'react-native';
import { useState as useStateHook, useEffect as useEffectHook } from 'react';
import { AlertItem } from '../../components/AlertItem';
import { api } from '../../services/api';

const Alerts = () => {
  const [alerts, setAlerts] = useStateHook([]);
  const [loading, setLoading] = useStateHook(true);
  const [filter, setFilter] = useStateHook('all');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlerts = () => {
    if (filter === 'all') return alerts;
    return alerts.filter((a) => a.severity === filter);
  };

  const getSeverityCount = (severity) => {
    return alerts.filter((a) => a.severity === severity).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Alerts...</Text>
      </View>
    );
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>ALERTS</Text>
      <Text style={styles.subtitle}>{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</Text>

      <View style={styles.filterRow}>
        <View
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onTouchEnd={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            ALL ({alerts.length})
          </Text>
        </View>
        <View
          style={[styles.filterButton, styles.filterCritical, filter === 'critical' && styles.filterActiveCritical]}
          onTouchEnd={() => setFilter('critical')}
        >
          <Text style={[styles.filterText, filter === 'critical' && styles.filterTextActive]}>
            CRITICAL ({getSeverityCount('critical')})
          </Text>
        </View>
        <View
          style={[styles.filterButton, styles.filterDanger, filter === 'danger' && styles.filterActiveDanger]}
          onTouchEnd={() => setFilter('danger')}
        >
          <Text style={[styles.filterText, filter === 'danger' && styles.filterTextActive]}>
            DANGER ({getSeverityCount('danger')})
          </Text>
        </View>
        <View
          style={[styles.filterButton, styles.filterWarning, filter === 'warning' && styles.filterActiveWarning]}
          onTouchEnd={() => setFilter('warning')}
        >
          <Text style={[styles.filterText, filter === 'warning' && styles.filterTextActive]}>
            WARNING ({getSeverityCount('warning')})
          </Text>
        </View>
        <View
          style={[styles.filterButton, styles.filterSafe, filter === 'safe' && styles.filterActiveSafe]}
          onTouchEnd={() => setFilter('safe')}
        >
          <Text style={[styles.filterText, filter === 'safe' && styles.filterTextActive]}>
            SAFE ({getSeverityCount('safe')})
          </Text>
        </View>
      </View>

      <View style={styles.alertsList}>
        {filteredAlerts.map((alert, index) => (
          <AlertItem key={index} alert={alert} />
        ))}
      </View>

      {filteredAlerts.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyText}>No alerts in this category</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  loadingText: { color: '#8B949E', fontSize: 18 },
  header: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 4, letterSpacing: 2 },
  subtitle: { color: '#8B949E', fontSize: 14, marginBottom: 20 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#21262D' },
  filterActive: { backgroundColor: '#3FB950' },
  filterCritical: { borderWidth: 1, borderColor: '#F85149' },
  filterActiveCritical: { backgroundColor: '#F85149' },
  filterDanger: { borderWidth: 1, borderColor: '#F85149' },
  filterActiveDanger: { backgroundColor: '#F85149' },
  filterWarning: { borderWidth: 1, borderColor: '#D29922' },
  filterActiveWarning: { backgroundColor: '#D29922' },
  filterSafe: { borderWidth: 1, borderColor: '#3FB950' },
  filterActiveSafe: { backgroundColor: '#3FB950' },
  filterText: { color: '#8B949E', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  filterTextActive: { color: '#FFFFFF' },
  alertsList: { gap: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, color: '#3FB950', marginBottom: 16 },
  emptyText: { color: '#8B949E', fontSize: 16 },
});

export default Alerts;
