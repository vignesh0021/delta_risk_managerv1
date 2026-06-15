import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { formatCurrency } from '../utils/formatting';

interface Leg {
  action: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
}

interface Adjustment {
  id: string;
  type: string;
  successProbability: number;
  riskReduction: number;
  requiredMargin: number;
  legs: Leg[];
  expectedResult: {
    newDelta: number;
    newGamma: number;
    newBreakEven: number;
  };
}

interface AdjustmentCardProps {
  adjustment: Adjustment;
  onExecute?: () => void;
  executing?: boolean;
}

export const AdjustmentCard = ({ adjustment, onExecute, executing }: AdjustmentCardProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.bestBadge}>
        <Text style={styles.bestText}>★ BEST ADJUSTMENT</Text>
      </View>

      <Text style={styles.type}>{adjustment.type}</Text>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>SUCCESS</Text>
          <Text style={[styles.metricValue, { color: adjustment.successProbability >= 70 ? '#3FB950' : '#D29922' }]}>
            {adjustment.successProbability}%
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>RISK ↓</Text>
          <Text style={[styles.metricValue, { color: '#3FB950' }]}>
            {adjustment.riskReduction}%
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>MARGIN</Text>
          <Text style={styles.metricValue}>{formatCurrency(adjustment.requiredMargin)}</Text>
        </View>
      </View>

      <View style={styles.legsContainer}>
        <Text style={styles.legsTitle}>EXECUTE COMMAND</Text>
        {adjustment.legs.map((leg, index) => (
          <View key={index} style={[styles.leg, { borderLeftColor: leg.action === 'BUY' ? '#3FB950' : '#F85149' }]}>
            <View style={styles.legHeader}>
              <Text style={[styles.legAction, { color: leg.action === 'BUY' ? '#3FB950' : '#F85149' }]}>
                {leg.action} TO {leg.action === 'BUY' ? 'CLOSE' : 'OPEN'}
              </Text>
              <Text style={styles.legQty}>× {leg.quantity}</Text>
            </View>
            <Text style={styles.legSymbol}>{leg.symbol}</Text>
            <Text style={styles.legPrice}>@ {formatCurrency(leg.price)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.expectedContainer}>
        <Text style={styles.expectedTitle}>EXPECTED RESULT</Text>
        <View style={styles.expectedRow}>
          <View style={styles.expectedItem}>
            <Text style={styles.expectedLabel}>New Delta</Text>
            <Text style={[styles.expectedValue, { color: Math.abs(adjustment.expectedResult.newDelta) < 0.2 ? '#3FB950' : '#D29922' }]}>
              {adjustment.expectedResult.newDelta.toFixed(4)}
            </Text>
          </View>
          <View style={styles.expectedItem}>
            <Text style={styles.expectedLabel}>New Gamma</Text>
            <Text style={[styles.expectedValue, { color: Math.abs(adjustment.expectedResult.newGamma) < 0.05 ? '#3FB950' : '#D29922' }]}>
              {adjustment.expectedResult.newGamma.toFixed(4)}
            </Text>
          </View>
          <View style={styles.expectedItem}>
            <Text style={styles.expectedLabel}>New Break Even</Text>
            <Text style={styles.expectedValue}>{formatCurrency(adjustment.expectedResult.newBreakEven)}</Text>
          </View>
        </View>
      </View>

      {onExecute && (
        <TouchableOpacity
          style={[styles.executeButton, executing && styles.executeButtonDisabled]}
          onPress={onExecute}
          disabled={executing}
        >
          <Text style={styles.executeText}>
            {executing ? 'EXECUTING...' : 'EXECUTE ADJUSTMENT'}
          </Text>
        </TouchableOpacity>
      )}
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
  },
  bestBadge: {
    backgroundColor: '#238636',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  bestText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  type: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 16, letterSpacing: 0.5 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metric: { flex: 1, alignItems: 'center' },
  metricLabel: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  legsContainer: { marginBottom: 16 },
  legsTitle: { color: '#8B949E', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  leg: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  legHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  legAction: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  legQty: { color: '#8B949E', fontSize: 12 },
  legSymbol: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  legPrice: { color: '#8B949E', fontSize: 13, marginTop: 2 },
  expectedContainer: { marginBottom: 16 },
  expectedTitle: { color: '#8B949E', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  expectedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expectedItem: { flex: 1, alignItems: 'center' },
  expectedLabel: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  expectedValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  executeButton: {
    backgroundColor: '#238636',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  executeButtonDisabled: { opacity: 0.6 },
  executeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
