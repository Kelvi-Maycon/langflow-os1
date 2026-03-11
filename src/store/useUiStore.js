import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uuid } from '../utils/shuffle.js';
import { persistStorage } from '../utils/persistStorage.js';

const STORE_VERSION = 1;
const MAX_NOTIFICATIONS = 25;
const DEFAULT_TOAST_DURATION = 4000;

function buildNotification(input = {}) {
  return {
    id: input.id || uuid(),
    kind: input.kind || 'info',
    title: input.title || 'Atualizacao',
    description: input.description || '',
    source: input.source || 'system',
    createdAt: input.createdAt || Date.now(),
    read: Boolean(input.read),
  };
}

export const useUiStore = create(
  persist(
    (set, get) => ({
      toasts: [],
      notifications: [],

      pushToast: (input = {}) => {
        const toast = {
          ...buildNotification(input),
          duration: input.duration ?? DEFAULT_TOAST_DURATION,
        };

        set((state) => ({
          toasts: [...state.toasts, toast],
        }));

        if (toast.duration > 0 && typeof window !== 'undefined') {
          window.setTimeout(() => {
            get().dismissToast(toast.id);
          }, toast.duration);
        }

        return toast.id;
      },

      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      pushNotification: (input = {}) => {
        const notification = buildNotification(input);

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
        }));

        return notification.id;
      },

      publishMilestone: (input = {}) => {
        const payload = buildNotification(input);
        get().pushNotification(payload);
        get().pushToast(payload);
        return payload.id;
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((entry) => (
            entry.id === id ? { ...entry, read: true } : entry
          )),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((entry) => ({ ...entry, read: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((entry) => entry.id !== id),
        })),

      clearUi: () => set({ toasts: [], notifications: [] }),
    }),
    {
      name: 'langflow_ui',
      storage: persistStorage,
      version: STORE_VERSION,
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
