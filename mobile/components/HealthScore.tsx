import { View, Text, StyleSheet } from 'react-native';
import { getHealthScoreColor } from '../utils/formatting';

interface HealthScoreProps {
  score: number;
  size?: number;
}

export const HealthScore = ({ score, size = 80 }: HealthScoreProps) => {
  const color = getHealthScoreColor(score);
  const borderWidth = 6;
  const radius = (size - borderWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.backgroundCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: '#21262D',
          },
        ]}
      />
      <View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: color,
            borderTopColor: score < 25 ? color : 'transparent',
            borderRightColor: score < 50 ? color : 'transparent',
            borderBottomColor: score < 75 ? color : 'transparent',
          },
        ]}
      />
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color, fontSize: size * 0.3 }]}>
          {score}
        </Text>
        <Text style={[styles.labelText, { fontSize: size * 0.12 }]}>SCORE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '800',
  },
  labelText: {
    color: '#8B949E',
    fontWeight: '600',
    letterSpacing: 1,
  },
});
