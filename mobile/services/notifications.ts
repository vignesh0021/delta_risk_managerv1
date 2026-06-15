import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  },

  async scheduleAlertNotification(title: string, body: string, severity: string) {
    const soundName = severity === 'critical' ? 'emergency.wav' : 'default';

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: soundName,
        priority: severity === 'critical' ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
        vibrate: severity === 'critical' ? [0, 500, 200, 500, 200, 500] : [0, 250, 250, 250],
      },
      trigger: null,
    });
  },

  async schedulePositionAlert(position: string, message: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Position Alert: ${position}`,
        body: message,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  },

  async scheduleRiskAlert(riskLevel: string, message: string) {
    const isEmergency = riskLevel === 'critical';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isEmergency ? '⚠ EMERGENCY RISK ALERT' : 'Risk Alert',
        body: message,
        sound: isEmergency ? 'emergency.wav' : 'default',
        priority: isEmergency ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
        vibrate: isEmergency ? [0, 500, 200, 500, 200, 500] : [0, 250, 250, 250],
      },
      trigger: null,
    });
  },

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
