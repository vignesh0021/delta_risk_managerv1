import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency, getRiskColor } from '../utils/formatting';

interface PositionCardProps {
  position: {
    symbol: string;
    expiry: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    mtm: number;
    pnl: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    riskLevel?: string;
  };
}

export const PositionCard = ({ position }: PositionCardProps) => {
  const getPnlColor = (value: number) => (value >= 0 ? '#3FB950' : '#F85149');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.symbol}>{position.symbol}</Text>
          <Text style={styles.expiry}>{position.expiry}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.pnl, { color: getPnlColor(position.pnl) }]}>
            {formatCurrency(position.pnl)}
          </Text>
          {position.riskLevel && (
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(position.riskLevel) }]}>
              <Text style={styles.riskText}>{position.riskLevel.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.label}>QTY</Text>
            <Text style={styles.value}>{position.quantity}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>AVG PRICE</Text>
            <Text style={styles.value}>{formatCurrency(position.avgPrice)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>LTP</Text>
            <Text style={styles.value}>{formatCurrency(position.currentPrice)}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.label}>MTM</Text>
            <Text style={[styles.value, { color: getPnlColor(position.mtm) }]}>
              {formatCurrency(position.mtm)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.greeksRow}>
          <View style={styles.greekItem}>
            <Text style={styles.greekLabel}>DELTA</Text>
            <Text style={[styles.greekValue, { color: Math.abs(position.delta) > 0.5 ? '#F85149' : '#3FB950' }]}>
              {position.delta.toFixed(4)}
            </Text>
          </View>
          <View style={styles.greekItem}>
            <Text style={styles.greekLabel}>GAMMA</Text>
            <Text style={[styles.greekValue, { color: Math.abs(position.gamma) > 0.1 ? '#F85149' : '#3FB950' }]}>
              {position.gamma.toFixed(4)}
            </Text>
          </View>
          <View style={styles.greekItem}>
            <Text style={styles.greekLabel}>THETA</Text>
            <Text style={[styles.greekValue, { color: '#F85149' }]}>
              {position.theta.toFixed(4)}
            </Text>
          </View>
          <View style={styles.greekItem}>
            <Text style={styles.greekLabel}>VEGA</Text>
            <Text style={[styles.greekValue, { color: Math.abs(position.vega) > 0.2 ? '#D29922' : '#3FB950' }]}>
              {position.vega.toFixed(4)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: { flex: 1 },
  symbol: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  expiry: { color: '#8B949E', fontSize: 13, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  pnl: { fontSize: 22, fontWeight: '800' },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  riskText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  details: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: { flex: 1, alignItems: 'center' },
  label: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  value: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#21262D', marginVertical: 12 },
  greeksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  greekItem: { flex: 1, alignItems: 'center' },
  greekLabel: { color: '#8B949E', fontSize: 9, letterSpacing: 0.5, marginBottom: 2 },
  greekValue: { fontSize: 13, fontWeight: '700' },
});
