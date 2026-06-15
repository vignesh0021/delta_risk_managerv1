import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useState } from 'react-native';
import { useState as useStateHook, useEffect } from 'react';
import { PositionCard } from '../../components/PositionCard';
import { GreeksDisplay } from '../../components/GreeksDisplay';
import { BreakEvenBar } from '../../components/BreakEvenBar';
import { api } from '../../services/api';
import { formatCurrency } from '../../utils/formatting';

const Positions = () => {
  const [positions, setPositions] = useStateHook([]);
  const [selectedPosition, setSelectedPosition] = useStateHook(null);
  const [loading, setLoading] = useStateHook(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const data = await api.getPositions();
      setPositions(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePosition = (index) => {
    setSelectedPosition(selectedPosition === index ? null : index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Positions...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>POSITIONS</Text>
      <Text style={styles.subtitle}>{positions.length} active position{positions.length !== 1 ? 's' : ''}</Text>

      {positions.map((position, index) => (
        <TouchableOpacity
          key={index}
          style={styles.positionWrapper}
          onPress={() => togglePosition(index)}
          activeOpacity={0.8}
        >
          <View style={styles.positionHeader}>
            <View style={styles.positionInfo}>
              <Text style={styles.positionSymbol}>{position.symbol}</Text>
              <Text style={styles.positionExpiry}>{position.expiry}</Text>
            </View>
            <View style={styles.positionPnl}>
              <Text style={[styles.pnlValue, { color: position.pnl >= 0 ? '#3FB950' : '#F85149' }]}>
                {formatCurrency(position.pnl)}
              </Text>
              <Text style={[styles.pnlPercent, { color: position.pnl >= 0 ? '#3FB950' : '#F85149' }]}>
                {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.positionSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>QTY</Text>
              <Text style={styles.summaryValue}>{position.quantity}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>AVG</Text>
              <Text style={styles.summaryValue}>{formatCurrency(position.avgPrice)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>LTP</Text>
              <Text style={styles.summaryValue}>{formatCurrency(position.currentPrice)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>MTM</Text>
              <Text style={[styles.summaryValue, { color: position.mtm >= 0 ? '#3FB950' : '#F85149' }]}>
                {formatCurrency(position.mtm)}
              </Text>
            </View>
          </View>

          {selectedPosition === index && (
            <View style={styles.expandedContent}>
              <View style={styles.divider} />

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>GREEKS</Text>
                <View style={styles.greeksGrid}>
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

              {position.breakEven && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailTitle}>BREAK EVEN</Text>
                  <BreakEvenBar
                    spotPrice={position.spotPrice}
                    lowerBE={position.breakEven.lower}
                    upperBE={position.breakEven.upper}
                  />
                  <View style={styles.beDetails}>
                    <View style={styles.beDetailItem}>
                      <Text style={styles.beDetailLabel}>Lower</Text>
                      <Text style={[styles.beDetailValue, { color: '#F85149' }]}>{formatCurrency(position.breakEven.lower)}</Text>
                    </View>
                    <View style={styles.beDetailItem}>
                      <Text style={styles.beDetailLabel}>Upper</Text>
                      <Text style={[styles.beDetailValue, { color: '#3FB950' }]}>{formatCurrency(position.breakEven.upper)}</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>RISK ASSESSMENT</Text>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(position.riskLevel) }]}>
                  <Text style={styles.riskBadgeText}>{position.riskLevel.toUpperCase()}</Text>
                </View>
                <Text style={styles.riskDescription}>{position.riskDescription}</Text>
              </View>
            </View>
          )}

          <View style={styles.expandIndicator}>
            <Text style={[styles.expandText, { transform: [{ rotate: selectedPosition === index ? '180deg' : '0deg' }] }]}>
              ▼
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const getRiskColor = (level) => {
  if (level === 'critical') return '#F85149';
  if (level === 'high') return '#F85149';
  if (level === 'medium') return '#D29922';
  if (level === 'low') return '#3FB950';
  return '#3FB950';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  loadingText: { color: '#8B949E', fontSize: 18 },
  header: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 4, letterSpacing: 2 },
  subtitle: { color: '#8B949E', fontSize: 14, marginBottom: 24 },
  positionWrapper: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, marginBottom: 12 },
  positionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  positionInfo: { flex: 1 },
  positionSymbol: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  positionExpiry: { color: '#8B949E', fontSize: 13, marginTop: 2 },
  positionPnl: { alignItems: 'flex-end' },
  pnlValue: { fontSize: 22, fontWeight: '800' },
  pnlPercent: { fontSize: 13, marginTop: 2 },
  positionSummary: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 2 },
  summaryValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  expandedContent: { marginTop: 12 },
  divider: { height: 1, backgroundColor: '#21262D', marginBottom: 12 },
  detailSection: { marginBottom: 16 },
  detailTitle: { color: '#8B949E', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  greeksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  greekItem: { width: '48%', backgroundColor: '#0D1117', borderRadius: 8, padding: 12 },
  greekLabel: { color: '#8B949E', fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  greekValue: { fontSize: 18, fontWeight: '800' },
  beDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  beDetailItem: { flex: 1, alignItems: 'center' },
  beDetailLabel: { color: '#8B949E', fontSize: 11, marginBottom: 2 },
  beDetailValue: { fontSize: 16, fontWeight: '700' },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginBottom: 8 },
  riskBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  riskDescription: { color: '#8B949E', fontSize: 13, lineHeight: 18 },
  expandIndicator: { alignItems: 'center', marginTop: 8 },
  expandText: { color: '#8B949E', fontSize: 12 },
});

export default Positions;
