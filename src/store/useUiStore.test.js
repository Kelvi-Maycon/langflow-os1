import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './useUiStore.js';

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.getState().clearUi();
  });

  it('adds a notification entry', () => {
    useUiStore.getState().pushNotification({
      title: 'Sessao pronta',
      kind: 'success',
      source: 'builder',
    });

    expect(useUiStore.getState().notifications).toHaveLength(1);
    expect(useUiStore.getState().notifications[0]).toMatchObject({
      title: 'Sessao pronta',
      kind: 'success',
      source: 'builder',
      read: false,
    });
  });

  it('marks a notification as read', () => {
    const id = useUiStore.getState().pushNotification({
      title: 'Revisao concluida',
      kind: 'success',
    });

    useUiStore.getState().markNotificationRead(id);

    expect(useUiStore.getState().notifications[0]?.read).toBe(true);
  });

  it('clears notifications', () => {
    useUiStore.getState().pushNotification({ title: 'A' });
    useUiStore.getState().pushNotification({ title: 'B' });

    useUiStore.getState().clearNotifications();

    expect(useUiStore.getState().notifications).toEqual([]);
  });

  it('keeps only the latest 25 notifications', () => {
    for (let index = 0; index < 30; index += 1) {
      useUiStore.getState().pushNotification({ title: `Item ${index}` });
    }

    const { notifications } = useUiStore.getState();
    expect(notifications).toHaveLength(25);
    expect(notifications[0]?.title).toBe('Item 29');
    expect(notifications.at(-1)?.title).toBe('Item 5');
  });
});
