import { View, Text, StyleSheet } from 'react-native';
import { getSeverityIcon, formatDateTime, getRiskColor } from '../utils/formatting';

interface Alert {
  id: string;
  severity: 'critical' | 'danger' | 'warning' | 'safe';
  title: string;
  message: string;
  actionRequired: string;
  timestamp: string;
  position?: string;
}

interface AlertItemProps {
  alert: Alert;
}

export const AlertItem = ({ alert }: AlertItemProps) => {
  const severityColor = getRiskColor(alert.severity);
  const icon = getSeverityIcon(alert.severity);

  return (
    <View style={[styles.container, { borderLeftColor: severityColor }]}>
      <View style={styles.header}>
        <View style={styles.severityRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.severity, { color: severityColor }]}>
            {alert.severity.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatDateTime(alert.timestamp)}</Text>
      </View>

      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.message}>{alert.message}</Text>

      {alert.position && (
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{alert.position}</Text>
        </View>
      )}

      <View style={[styles.actionContainer, { backgroundColor: `${severityColor}15` }]}>
        <Text style={[styles.actionLabel, { color: severityColor }]}>ACTION REQUIRED:</Text>
        <Text style={styles.actionText}>{alert.actionRequired}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: { fontSize: 14 },
  severity: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  timestamp: { color: '#8B949E', fontSize: 11 },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  message: { color: '#8B949E', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  positionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#21262D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  positionText: { color: '#58A6FF', fontSize: 12, fontWeight: '600' },
  actionContainer: {
    borderRadius: 8,
    padding: 12,
  },
  actionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  actionText: { color: '#FFFFFF', fontSize: 13, lineHeight: 18 },
});
