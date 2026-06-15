import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AdjustmentCard } from '../components/AdjustmentCard';
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatting';

const Adjustment = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [adjustment, setAdjustment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchAdjustment();
  }, []);

  const fetchAdjustment = async () => {
    try {
      const data = await api.getAdjustments();
      setAdjustment(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAdjustment = async () => {
    setExecuting(true);
    try {
      await api.sendAdjustmentFeedback(adjustment.id, 'execute');
      router.back();
    } catch (error) {
      console.error('Execute error:', error);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Adjustment...</Text>
      </View>
    );
  }

  if (!adjustment) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No adjustment available</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() =>router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.header}>ADJUSTMENT</Text>
      </View>

      <View style={styles.bestBadge}>
        <Text style={styles.bestBadgeText}>★ BEST ADJUSTMENT</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.adjustmentType}>{adjustment.type}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>SUCCESS PROB</Text>
            <Text style={[styles.metricValue, { color: adjustment.successProbability >= 70 ? '#3FB950' : '#D29922' }]}>
              {adjustment.successProbability}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>RISK REDUCTION</Text>
            <Text style={[styles.metricValue, { color: '#3FB950' }]}>
              {adjustment.riskReduction}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>REQUIRED MARGIN</Text>
            <Text style={styles.metricValue}>{formatCurrency(adjustment.requiredMargin)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.commandSection}>
        <Text style={styles.commandTitle}>EXECUTE COMMAND</Text>
        {adjustment.legs.map((leg, index) => (
          <View key={index} style={[styles.legCard, { borderLeftColor: leg.action === 'BUY' ? '#3FB950' : '#F85149' }]}>
            <View style={styles.legHeader}>
              <Text style={[styles.legAction, { color: leg.action === 'BUY' ? '#3FB950' : '#F85149' }]}>
                {leg.action} TO {leg.action === 'BUY' ? 'CLOSE' : 'OPEN'}
              </Text>
              <Text style={styles.legQty}>QTY: {leg.quantity}</Text>
            </View>
            <Text style={styles.legSymbol}>{leg.symbol}</Text>
            <Text style={styles.legPrice}>@ {formatCurrency(leg.price)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.expectedSection}>
        <Text style={styles.expectedTitle}>EXPECTED RESULT</Text>
        <View style={styles.expectedGrid}>
          <View style={styles.expectedItem}>
            <Text style={styles.expectedLabel}>NEW DELTA</Text>
            <Text style={[styles.expectedValue, { color: Math.abs(adjustment.expectedResult.newDelta) < 0.2 ? '#3FB950' : '#D29922' }]}>
              {adjustment.expectedResult.newDelta.toFixed(4)}
            </Text>
          </View>
          <View style={styles.expectedItem}>
            <Text style={styles.expectedLabel}>NEW GAMMA</Text>
            <Text style={[styles.expectedValue, { color: Math.abs(adjustment.expectedResult.newGamma) < 0.05 ? '#3FB950' : '#D29922' }]}>
              {adjustment.expectedResult.newGamma.toFixed(4)}
            </Text>
          </View>
          <View style={styles.expectedItem}>
            <Text style={styles.expectedLabel}>NEW BREAK EVEN</Text>
            <Text style={styles.expectedValue}>{formatCurrency(adjustment.expectedResult.newBreakEven)}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.executeButton, executing && styles.executeButtonDisabled]}
        onPress={executeAdjustment}
        disabled={executing}
      >
        <Text style={styles.executeButtonText}>
          {executing ? 'EXECUTING...' : 'EXECUTE ADJUSTMENT'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>CANCEL</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  loadingText: { color: '#8B949E', fontSize: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 16 },
  backText: { color: '#58A6FF', fontSize: 16, fontWeight: '700' },
  header: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#8B949E', fontSize: 18 },
  bestBadge: { backgroundColor: '#238636', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  bestBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  mainCard: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 20, marginBottom: 16 },
  adjustmentType: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 20, letterSpacing: 1 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  metricValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  commandSection: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, marginBottom: 16 },
  commandTitle: { color: '#8B949E', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  legCard: { backgroundColor: '#0D1117', borderWidth: 1, borderColor: '#21262D', borderLeftWidth: 3, borderRadius: 8, padding: 14, marginBottom: 8 },
  legHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  legAction: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  legQty: { color: '#8B949E', fontSize: 12 },
  legSymbol: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  legPrice: { color: '#8B949E', fontSize: 14 },
  expectedSection: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, marginBottom: 16 },
  expectedTitle: { color: '#8B949E', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  expectedGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  expectedItem: { flex: 1, alignItems: 'center' },
  expectedLabel: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  expectedValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  executeButton: { backgroundColor: '#238636', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 12 },
  executeButtonDisabled: { opacity: 0.6 },
  executeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  cancelButton: { borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 18, alignItems: 'center' },
  cancelButtonText: { color: '#8B949E', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

export default Adjustment;
