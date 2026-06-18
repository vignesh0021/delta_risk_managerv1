import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { storage } from '../utils/storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const token = await storage.getToken();
      if (!mounted) return;
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  text: { color: '#8B949E', fontSize: 18 },
});
