import { ClientAccount } from '../types';
import { getRawLocalConfig, setRawLocalConfig } from '../lib/database/configuracion';

export type NotificationType = 'menu' | 'reparto' | 'entregado' | 'credito' | 'cupon';

export interface NotificationClickEvent {
  type: NotificationType;
  payload?: any;
}

let clickListener: ((event: NotificationClickEvent) => void) | null = null;

export const registerNotificationClickListener = (listener: (event: NotificationClickEvent) => void) => {
  clickListener = listener;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return 'default';
  }
};

export const sendWebPushNotification = (
  title: string,
  body: string,
  type: NotificationType,
  payload?: any
) => {
  const customPayload = payload || {};
  
  // Trigger in-app toast event first so the user sees it in the app UI
  triggerInAppToast(title, body, type, customPayload);

  // Trigger native browser notification if allowed
  if ('Notification' in window && Notification.permission === 'granted') {
    const options: NotificationOptions = {
      body,
      icon: '', // green fruit icon
      badge: '',
      tag: `rf-notif-${type}-${customPayload.orderId || Date.now()}`,
      requireInteraction: true,
    };
    
    try {
      const n = new Notification(title, options);
      n.onclick = (e) => {
        e.preventDefault();
        window.focus();
        if (clickListener) {
          clickListener({ type, payload: customPayload });
        }
        n.close();
      };
    } catch (err) {
      console.warn("Failed to trigger native Notification:", err);
    }
  }
};

const triggerInAppToast = (title: string, body: string, type: NotificationType, payload?: any) => {
  const event = new CustomEvent('rf_in_app_notification', {
    detail: { title, body, type, payload }
  });
  window.dispatchEvent(event);
};

/**
 * Checks if the daily menu notification (at 8:30 AM) needs to be sent.
 * It checks active client preferences, current time, and a localStorage flag.
 */
export const checkDailyMenuNotification = (
  activeClient: ClientAccount,
  onTrigger: () => void
) => {
  if (!activeClient || !activeClient.notificationPrefs?.menuDelDia) return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Target time: 8:30 AM
  const isPastTime = currentHour > 8 || (currentHour === 8 && currentMinute >= 30);
  if (!isPastTime) return;

  const todayStr = now.toDateString(); // e.g., "Thu Jun 25 2026"
  const lastSentKey = `rf_last_menu_notif_${activeClient.phone}`;
  const lastSentDate = getRawLocalConfig(lastSentKey, '');

  if (lastSentDate !== todayStr) {
    setRawLocalConfig(lastSentKey, todayStr);
    
    sendWebPushNotification(
      '🍳 ¡Ya está listo el menú de hoy!',
      'Descubre los productos disponibles y realiza tu pedido.',
      'menu'
    );
    onTrigger();
  }
};
