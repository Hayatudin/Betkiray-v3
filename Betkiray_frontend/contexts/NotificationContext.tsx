// contexts/NotificationContext.tsx
import { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useUser } from './UserContext';
import api from '@/config/api';
import { router } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NotificationContext = createContext({});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync();

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        const { chatId } = response.notification.request.content.data;
        if (chatId) {
            // This navigation is a bit simplistic. You might need to pass more
            // recipient data or fetch it before navigating.
            router.push(`/chat/${chatId}`);
        }
      });

      return () => {
        if(notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
        if(responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
      };
    }
  }, [user]);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas.projectId;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        
        // Send the token to your backend
        await api.post('/notifications/register', { token });
        console.log('Push token registered successfully:', token);

    } catch(e) {
        console.error("Failed to get push token", e)
    }
  }

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
