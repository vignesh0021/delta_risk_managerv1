import { View, Text, StyleSheet } from 'react-native';

interface BreakEvenBarProps {
  spotPrice: number;
  lowerBE: number;
  upperBE: number;
}

export const BreakEvenBar = ({ spotPrice, lowerBE, upperBE }: BreakEvenBarProps) => {
  const range = upperBE - lowerBE;
  const spotPosition = ((spotPrice - lowerBE) / range) * 100;
  const clampedPosition = Math.max(0, Math.min(100, spotPosition));

  const getBarColor = () => {
    if (spotPrice < lowerBE || spotPrice > upperBE) return '#F85149';
    if (spotPrice < lowerBE + range * 0.2 || spotPrice > upperBE - range * 0.2) return '#D29922';
    return '#3FB950';
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={[styles.label, { color: '#F85149' }]}>LOSS ZONE</Text>
        <Text style={[styles.label, { color: '#3FB950' }]}>SAFE ZONE</Text>
        <Text style={[styles.label, { color: '#F85149' }]}>LOSS ZONE</Text>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.lowerLossZone, { width: '20%' }]} />
          <View style={[styles.safeZone, { width: '60%' }]} />
          <View style={[styles.upperLossZone, { width: '20%' }]} />
        </View>

        <View style={[styles.marker, { left: `${clampedPosition}%` }]}>
          <View style={[styles.markerDot, { backgroundColor: getBarColor() }]} />
          <View style={[styles.markerLine, { backgroundColor: getBarColor() }]} />
          <Text style={[styles.markerLabel, { color: getBarColor() }]}>
            SPOT
          </Text>
        </View>

        <View style={[styles.beMarker, { left: '0%' }]}>
          <Text style={styles.beMarkerText}>LBE</Text>
        </View>

        <View style={[styles.beMarker, { left: '100%' }]}>
          <Text style={styles.beMarkerText}>UBE</Text>
        </View>
      </View>

      <View style={styles.pricesRow}>
        <Text style={[styles.price, { color: '#F85149' }]}>₹{lowerBE.toLocaleString('en-IN')}</Text>
        <Text style={[styles.price, { color: getBarColor() }]}>₹{spotPrice.toLocaleString('en-IN')}</Text>
        <Text style={[styles.price, { color: '#3FB950' }]}>₹{upperBE.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  barContainer: {
    height: 24,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barBackground: {
    flexDirection: 'row',
    height: '100%',
  },
  lowerLossZone: { backgroundColor: 'rgba(248, 81, 73, 0.3)' },
  safeZone: { backgroundColor: 'rgba(63, 185, 80, 0.3)' },
  upperLossZone: { backgroundColor: 'rgba(248, 81, 73, 0.3)' },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    transform: [{ translateX: -6 }],
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  markerLine: {
    width: 2,
    height: 12,
  },
  markerLabel: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
  beMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    transform: [{ translateX: -10 }],
  },
  beMarkerText: {
    color: '#8B949E',
    fontSize: 8,
    fontWeight: '700',
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: { fontSize: 12, fontWeight: '700' },
});
