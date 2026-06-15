import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

const TabLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161B22',
          borderTopColor: '#21262D',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3FB950',
        tabBarInactiveTintColor: '#8B949E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <View style={[styles.icon, { borderColor: color }]}>
              <View style={[styles.iconInner, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="positions"
        options={{
          title: 'Positions',
          tabBarIcon: ({ color }) => (
            <View style={[styles.icon, { borderColor: color }]}>
              <View style={[styles.iconDash1, { backgroundColor: color }]} />
              <View style={[styles.iconDash2, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <View style={[styles.bellIcon, { borderColor: color }]}>
              <View style={[styles.bellTop, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <View style={[styles.gearIcon, { borderColor: color }]}>
              <View style={[styles.gearInner, { borderColor: color }]} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  iconDash1: {
    width: 16,
    height: 2,
    marginBottom: 3,
  },
  iconDash2: {
    width: 10,
    height: 2,
  },
  bellIcon: {
    width: 24,
    height: 28,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  bellTop: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gearIcon: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearInner: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderRadius: 5,
  },
});

export default TabLayout;
