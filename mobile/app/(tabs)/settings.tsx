import { View, Text, ScrollView, StyleSheet, TextInput, Switch, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [websocketEnabled, setWebsocketEnabled] = useState(true);
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [emergencySound, setEmergencySound] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await storage.getSettings();
    if (settings) {
      setApiKey(settings.apiKey || '');
      setApiSecret(settings.apiSecret || '');
      setWebsocketEnabled(settings.websocketEnabled ?? true);
      setAlertNotifications(settings.alertNotifications ?? true);
      setCriticalAlerts(settings.criticalAlerts ?? true);
      setEmergencySound(settings.emergencySound ?? true);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await storage.saveSettings({
        apiKey,
        apiSecret,
        websocketEnabled,
        alertNotifications,
        criticalAlerts,
        emergencySound,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>SETTINGS</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API CREDENTIALS</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>API KEY</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your API key"
            placeholderTextColor="#484F58"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>API SECRET</Text>
          <View style={styles.secretContainer}>
            <TextInput
              style={[styles.input, styles.secretInput]}
              value={apiSecret}
              onChangeText={setApiSecret}
              placeholder="Enter your API secret"
              placeholderTextColor="#484F58"
              secureTextEntry={!showSecret}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.toggleSecretButton}
              onPress={() => setShowSecret(!showSecret)}
            >
              <Text style={styles.toggleSecretText}>{showSecret ? 'HIDE' : 'SHOW'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONNECTION</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>WEBSOCKET</Text>
            <Text style={styles.settingDescription}>Real-time position updates</Text>
          </View>
          <Switch
            value={websocketEnabled}
            onValueChange={setWebsocketEnabled}
            trackColor={{ false: '#21262D', true: '#238636' }}
            thumbColor={websocketEnabled ? '#FFFFFF' : '#8B949E'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>ALERT NOTIFICATIONS</Text>
            <Text style={styles.settingDescription}>Receive push notifications for alerts</Text>
          </View>
          <Switch
            value={alertNotifications}
            onValueChange={setAlertNotifications}
            trackColor={{ false: '#21262D', true: '#238636' }}
            thumbColor={alertNotifications ? '#FFFFFF' : '#8B949E'}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>CRITICAL ALERTS ONLY</Text>
            <Text style={styles.settingDescription}>Only notify for critical risk alerts</Text>
          </View>
          <Switch
            value={criticalAlerts}
            onValueChange={setCriticalAlerts}
            trackColor={{ false: '#21262D', true: '#238636' }}
            thumbColor={criticalAlerts ? '#FFFFFF' : '#8B949E'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EMERGENCY</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>EMERGENCY SOUND</Text>
            <Text style={styles.settingDescription}>Play loud sound for critical alerts</Text>
          </View>
          <Switch
            value={emergencySound}
            onValueChange={setEmergencySound}
            trackColor={{ false: '#21262D', true: '#F85149' }}
            thumbColor={emergencySound ? '#FFFFFF' : '#8B949E'}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveSettings}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'SAVING...' : saved ? 'SAVED ✓' : 'SAVE SETTINGS'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>LOGOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  content: { padding: 16, paddingBottom: 100 },
  header: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 24, letterSpacing: 2 },
  section: { backgroundColor: '#161B22', borderWidth: 1, borderColor: '#21262D', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#8B949E', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#8B949E', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: '#0D1117', borderWidth: 1, borderColor: '#21262D', borderRadius: 8, padding: 14, color: '#FFFFFF', fontSize: 15 },
  secretContainer: { flexDirection: 'row', gap: 8 },
  secretInput: { flex: 1 },
  toggleSecretButton: { backgroundColor: '#21262D', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  toggleSecretText: { color: '#58A6FF', fontSize: 12, fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#21262D' },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  settingDescription: { color: '#8B949E', fontSize: 12 },
  saveButton: { backgroundColor: '#238636', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  logoutButton: { borderWidth: 1, borderColor: '#F85149', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12 },
  logoutButtonText: { color: '#F85149', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

export default Settings;
