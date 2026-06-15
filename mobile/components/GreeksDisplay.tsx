import { View, Text, StyleSheet } from 'react-native';

interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface GreeksDisplayProps {
  greeks: Greeks;
}

export const GreeksDisplay = ({ greeks }: GreeksDisplayProps) => {
  const getDeltaClassification = (delta: number) => {
    const absDelta = Math.abs(delta);
    if (absDelta < 0.2) return { text: 'NEUTRAL', color: '#3FB950' };
    if (absDelta < 0.5) return { text: 'MODERATE', color: '#D29922' };
    return { text: 'AGGRESSIVE', color: '#F85149' };
  };

  const getGammaClassification = (gamma: number) => {
    const absGamma = Math.abs(gamma);
    if (absGamma < 0.05) return { text: 'LOW', color: '#3FB950' };
    if (absGamma < 0.1) return { text: 'MODERATE', color: '#D29922' };
    return { text: 'HIGH', color: '#F85149' };
  };

  const getThetaClassification = (theta: number) => {
    const absTheta = Math.abs(theta);
    if (absTheta < 0.02) return { text: 'MINIMAL', color: '#3FB950' };
    if (absTheta < 0.05) return { text: 'MODERATE', color: '#D29922' };
    return { text: 'SIGNIFICANT', color: '#F85149' };
  };

  const getVegaClassification = (vega: number) => {
    const absVega = Math.abs(vega);
    if (absVega < 0.1) return { text: 'LOW', color: '#3FB950' };
    if (absVega < 0.2) return { text: 'MODERATE', color: '#D29922' };
    return { text: 'HIGH', color: '#F85149' };
  };

  const deltaClass = getDeltaClassification(greeks.delta);
  const gammaClass = getGammaClassification(greeks.gamma);
  const thetaClass = getThetaClassification(greeks.theta);
  const vegaClass = getVegaClassification(greeks.vega);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>NET DELTA</Text>
          <Text style={[styles.value, { color: deltaClass.color }]}>
            {greeks.delta.toFixed(4)}
          </Text>
          <Text style={[styles.classification, { color: deltaClass.color }]}>
            {deltaClass.text}
          </Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>NET GAMMA</Text>
          <Text style={[styles.value, { color: gammaClass.color }]}>
            {greeks.gamma.toFixed(4)}
          </Text>
          <Text style={[styles.classification, { color: gammaClass.color }]}>
            {gammaClass.text}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.label}>NET THETA</Text>
          <Text style={[styles.value, { color: thetaClass.color }]}>
            {greeks.theta.toFixed(4)}
          </Text>
          <Text style={[styles.classification, { color: thetaClass.color }]}>
            {thetaClass.text}
          </Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>NET VEGA</Text>
          <Text style={[styles.value, { color: vegaClass.color }]}>
            {greeks.vega.toFixed(4)}
          </Text>
          <Text style={[styles.classification, { color: vegaClass.color }]}>
            {vegaClass.text}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  item: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  label: {
    color: '#8B949E',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  classification: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
