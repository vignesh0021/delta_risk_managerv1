import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { PositionCard } from '../../components/PositionCard';
import { HealthScore } from '../../components/HealthScore';
import { GreeksDisplay } from '../../components/GreeksDisplay';
import { BreakEvenBar } from '../../components/BreakEvenBar';
import { api } from '../../services/api';
import { formatCurrency, formatPercent, getRiskColor } from '../../utils/formatting';

const Dashboard = () => {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setConnectionError('');
      const [accountRes, positionsRes, alertsRes] = await Promise.all([
        api.getAccount(),
        api.getPositions(),
        api.getAlerts(),
      ]);
      setAccount(accountRes);
      setPositions(positionsRes);
      setAlerts(alertsRes);
      setLastUpdated(new Date());
    } catch (error) {
      const errMsg = (error as any)?.response?.data?.detail || (error as any)?.message || 'Failed to fetch data';
      console.error('Fetch error:', error);
      setConnectionError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScore = () => {
    if (!account) return 0;
    return account.portfolioRisk?.healthScore || 0;
  };

  const getRiskLevel = () => {
    if (!account) return 'safe';
    const risk = account.portfolioRisk?.level || 'low';
    if (risk === 'critical') return 'critical';
    if (risk === 'high') return 'danger';
    if (risk === 'medium') return 'caution';
    return 'safe';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>DASHBOARD</Text>

      {connectionError ? (
        <TouchableOpacity style={styles.errorBanner} onPress={fetchData}>
          <Text style={styles.errorBannerText}>⚠️ {connectionError}</Text>
          <Text style={styles.errorBannerSubtext}>Tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      {lastUpdated ? (
        <Text style={styles.lastUpdated}>Last updated: {lastUpdated.toLocaleTimeString()}</Text>
      ) : null}

      <View style={styles.accountSection}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.accountGrid}>
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>CURRENT PNL</Text>
            <Text style={[styles.accountValue, { color: (account?.currentPnl || 0) >= 0 ? '#3FB950' : '#F85149' }]}>
              {formatCurrency(account?.currentPnl || 0)}
            </Text>
          </View>
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>TODAY PNL</Text>
            <Text style={[styles.accountValue, { color: (account?.todayPnl || 0) >= 0 ? '#3FB950' : '#F85149' }]}>
              {formatCurrency(account?.todayPnl || 0)}
            </Text>
          </View>
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>MARGIN USED</Text>
            <Text style={styles.accountValue}>{formatCurrency(account?.marginUsed || 0)}</Text>
          </View>
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>AVAILABLE MARGIN</Text>
            <Text style={[styles.accountValue, { color: '#3FB950' }]}>{formatCurrency(account?.availableMargin || 0)}</Text>
          </View>
        </View>
        <View style={styles.riskRow}>
          <View style={styles.riskItem}>
            <Text style={styles.accountLabel}>PORTFOLIO RISK</Text>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(getRiskLevel()) }]}>
              <Text style={styles.riskBadgeText}>{getRiskLevel().toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.accountLabel}>HEALTH SCORE</Text>
            <HealthScore score={getHealthScore()} />
          </View>
        </View>
      </View>

      <View style={styles.positionsSection}>
        <Text style={styles.sectionTitle}>LIVE POSITIONS ({positions.length})</Text>
        {positions.map((position, index) => (
          <PositionCard key={index} position={position} />
        ))}
      </View>

      {account?.breakEven && (
        <View style={styles.breakEvenSection}>
          <Text style={styles.sectionTitle}>BREAK EVEN ANALYSIS</Text>
          <BreakEvenBar
            spotPrice={account.spotPrice}
            lowerBE={account.breakEven.lower}
            upperBE={account.breakEven.upper}
          />
          <View style={styles.beInfo}>
            <View style={styles.beItem}>
              <Text style={styles.beLabel}>Lower BE</Text>
              <Text style={[styles.beValue, { color: '#F85149' }]}>{formatCurrency(account.breakEven.lower)}</Text>
              <Text style={styles.beDistance}>{account.breakEven.lowerDistance}% away</Text>
            </View>
            <View style={styles.beItem}>
              <Text style={styles.beLabel}>Spot Price</Text>
              <Text style={[styles.beValue, { color: '#58A6FF' }]}>{formatCurrency(account.spotPrice)}</Text>
            </View>
            <View style={styles.beItem}>
              <Text style={styles.beLabel}>Upper BE</Text>
              <Text style={[styles.beValue, { color: '#3FB950' }]}>{formatCurrency(account.breakEven.upper)}</Text>
              <Text style={styles.beDistance}>{account.breakEven.upperDistance}% away</Text>
            </View>
          </View>
          <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(account.breakEven.riskLevel) }]}>
            <Text style={styles.riskIndicatorText}>RISK: {account.breakEven.riskLevel.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {account?.netGreeks && (
        <View style={styles.greeksSection}>
          <Text style={styles.sectionTitle}>NET GREEKS</Text>
          <GreeksDisplay greeks={account.netGreeks} />
        </View>
      )}

      {account?.gammaRisk !== undefined && (
        <View style={styles.gammaSection}>
          <Text style={styles.sectionTitle}>GAMMA RISK</Text>
          <View style={styles.gammaCard}>
            <Text style={styles.gammaLabel}>Gamma Exposure</Text>
            <Text style={[styles.gammaValue, { color: Math.abs(account.gammaRisk) > 0.5 ? '#F85149' : '#3FB950' }]}>
              {account.gammaRisk.toFixed(4)}
            </Text>
            <Text style={styles.gammaStatus}>
              {Math.abs(account.gammaRisk) > 0.5 ? 'HIGH GAMMA RISK' : 'LOW GAMMA RISK'}
            </Text>
          </View>
        </View>
      )}

      {account?.trend && (
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>TREND STATUS</Text>
          <View style={[styles.trendCard, { borderLeftColor: account.trend === 'bullish' ? '#3FB950' : account.trend === 'bearish' ? '#F85149' : '#D29922' }]}>
            <Text style={[styles.trendValue, { color: account.trend === 'bullish' ? '#3FB950' : account.trend === 'bearish' ? '#F85149' : '#D29922' }]}>
              {account.trend.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {alerts.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => router.push('/(tabs)/alerts')}
        >
          <Text style={styles.alertBannerText}>
            {alerts.length} ACTIVE ALERT - TAP TO VIEW
          </Text>
        </TouchableOpacity>
      )}

      {account?.suggestedAdjustment && (
        <TouchableOpacity
          style={styles.adjustmentButton}
          onPress={() => router.push('/adjustment')}
        >
          <Text style={styles.adjustmentButtonText}>VIEW ADJUSTMENT RECOMMENDATION</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  loadingText: { color: '#8B949E', fontSize: 18 },
  errorBanner: { backgroundColor: 'rgba(248,81,73,0.2)', borderWidth: 1, borderColor: '#F85149', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  errorBannerText: { color: '#F85149', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  errorBannerSubtext: { color: '#F85149', fontSize: 12, marginTop: 4, opacity: 0.8 },
  lastUpdated: { color: '#484F58', fontSize: 11, textAlign: 'right', marginBottom: 8 },
  header: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 24, letterSpacing: 2 },
  sectionTitle: { color: '#8B949E', fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  accountSection: { marginBottom: 24 },
  accountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  accountCard: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, width: '48%' },
  accountLabel: { color: '#8B949E', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  accountValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  riskRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  riskItem: { flex: 1, alignItems: 'center' },
  riskBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  riskBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  positionsSection: { marginBottom: 24 },
  breakEvenSection: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, marginBottom: 24 },
  beInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  beItem: { alignItems: 'center', flex: 1 },
  beLabel: { color: '#8B949E', fontSize: 11, marginBottom: 4 },
  beValue: { fontSize: 18, fontWeight: '800' },
  beDistance: { color: '#8B949E', fontSize: 10, marginTop: 2 },
  riskIndicator: { marginTop: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  riskIndicatorText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  greeksSection: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, marginBottom: 24 },
  gammaSection: { marginBottom: 24 },
  gammaCard: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, alignItems: 'center' },
  gammaLabel: { color: '#8B949E', fontSize: 12, marginBottom: 8 },
  gammaValue: { fontSize: 36, fontWeight: '800' },
  gammaStatus: { color: '#8B949E', fontSize: 11, marginTop: 4, letterSpacing: 1 },
  trendSection: { marginBottom: 24 },
  trendCard: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderLeftWidth: 4, borderRadius: 12, padding: 16 },
  trendValue: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  alertBanner: { backgroundColor: '#F85149', borderRadius: 12, padding: 16, marginBottom: 24, alignItems: 'center' },
  alertBannerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  adjustmentButton: { backgroundColor: '#238636', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 24 },
  adjustmentButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

export default Dashboard;
