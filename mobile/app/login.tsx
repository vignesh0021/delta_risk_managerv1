import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '../utils/storage';
import { api } from '../services/api';

const LoginScreen = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        // Already logged in, go to dashboard
        router.replace('/(tabs)');
        return;
      }
      // Pre-fill from local storage if available
      const settings = await storage.getSettings();
      if (settings) {
        setApiKey(settings.apiKey || '');
        setApiSecret(settings.apiSecret || '');
        setBackendUrl(settings.backendUrl || 'http://localhost:8000');
      }
    } catch (e) {
      console.error('Auth check error:', e);
    } finally {
      setChecking(false);
    }
  };

  const handleLogin = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError('Please enter both API Key and API Secret');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.apiKeyLogin(apiKey.trim(), apiSecret.trim());
      // Save to local storage too (merge with existing)
      const existing = await storage.getSettings() || {};
      await storage.saveSettings({
        ...existing,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        backendUrl,
        websocketEnabled: true,
        alertNotifications: true,
        criticalAlerts: true,
        emergencySound: true,
      });
      router.replace('/(tabs)');
    } catch (err) {
      const msg = (err as any)?.response?.data?.detail || (err as any)?.message || 'Login failed. Check your API keys and backend connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking session...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>DELTA RISK MANAGER</Text>
      <Text style={styles.subHeader}>Connect your Delta Exchange account</Text>

      <View style={styles.card}>
        <Text style={styles.label}>API KEY</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Paste your Delta Exchange API key"
          placeholderTextColor="#484F58"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>API SECRET</Text>
        <View style={styles.secretRow}>
          <TextInput
            style={[styles.input, styles.secretInput]}
            value={apiSecret}
            onChangeText={setApiSecret}
            placeholder="Paste your Delta Exchange API secret"
            placeholderTextColor="#484F58"
            secureTextEntry={!showSecret}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.showBtn}
            onPress={() => setShowSecret(!showSecret)}
          >
            <Text style={styles.showBtnText}>{showSecret ? 'HIDE' : 'SHOW'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>BACKEND URL</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="http://192.168.1.100:8000"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Text style={styles.hintText}>Use your computer's IP if backend runs there</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>
            {loading ? 'CONNECTING...' : 'CONNECT TO BROKER'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Create API keys in Delta Exchange {'>'} Settings {'>'} API Management.{'\n'}
          Enable "Read Data" and "Trading" permissions.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 24, paddingTop: 80, alignItems: 'center' },
  loadingText: { color: '#8B949E', fontSize: 16, marginTop: 100 },
  header: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  subHeader: { color: '#8B949E', fontSize: 14, marginBottom: 40, textAlign: 'center' },
  card: { width: '100%', backgroundColor: '#161B22', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#21262D' },
  label: { color: '#8B949E', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#0D1117', borderWidth: 1, borderColor: '#30363D', borderRadius: 10, padding: 14, color: '#FFFFFF', fontSize: 14 },
  secretRow: { flexDirection: 'row', gap: 8 },
  secretInput: { flex: 1 },
  showBtn: { backgroundColor: '#21262D', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  showBtnText: { color: '#58A6FF', fontSize: 12, fontWeight: '700' },
  errorBox: { backgroundColor: 'rgba(248,81,73,0.15)', borderRadius: 8, padding: 12, marginTop: 16 },
  errorText: { color: '#F85149', fontSize: 13 },
  loginBtn: { backgroundColor: '#238636', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 24 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  hintText: { color: '#484F58', fontSize: 11, marginTop: 4 },
  hint: { color: '#484F58', fontSize: 12, marginTop: 20, textAlign: 'center', lineHeight: 18 },
});

export default LoginScreen;
