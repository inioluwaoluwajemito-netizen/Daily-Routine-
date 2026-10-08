import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TimeBlock } from '../types';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldPresentAlert: true,
    shouldShowList: true,
  }),
});

export async function initNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Setup Android Notification Channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('routine-reminders', {
      name: 'Routine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
      sound: 'default',
      enableVibrate: true,
    });
  }

  return true;
}

export async function scheduleBlockReminder(block: TimeBlock, leadMinutes: number = 5): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const [startH, startM] = block.startTime.split(':').map(Number);
    let targetH = startH;
    let targetM = startM - leadMinutes;

    if (targetM < 0) {
      targetH -= 1;
      targetM += 60;
    }
    if (targetH < 0) {
      targetH += 24;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming: ${block.title}`,
        body: leadMinutes > 0 
          ? `Starting in ${leadMinutes} minutes (${block.startTime})`
          : `Starting right now!`,
        sound: 'default',
        data: { blockId: block.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: targetH,
        minute: targetM,
        channelId: 'routine-reminders',
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function syncAllReminders(blocks: TimeBlock[], leadMinutes: number = 5): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelAllReminders();
  for (const block of blocks) {
    if (block.isRecurring) {
      await scheduleBlockReminder(block, leadMinutes);
    }
  }
}

export async function sendInstantTestNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    alert('Notifications are simulated in Web mode.');
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DayGuide Ready 🚀',
      body: 'Your daily routine coach is active and protecting your focus.',
      sound: 'default',
    },
    trigger: null, // immediate
  });
}
