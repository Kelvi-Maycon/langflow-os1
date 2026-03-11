import { useMemo, useState } from 'react';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { Card } from '../ui/card.jsx';
import { useUiStore } from '../../store/useUiStore.js';
import { BellIcon } from './icons.jsx';

function formatRelativeDate(timestamp) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  return `${Math.round(diffHours / 24)} d`;
}

export default function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useUiStore();

  const unreadCount = useMemo(
    () => notifications.filter((entry) => !entry.read).length,
    [notifications]
  );

  return (
    <div className="notifications-popover">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="notifications-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon size={16} strokeWidth={2.1} />
        {unreadCount > 0 ? (
          <span className="notifications-badge" data-testid="notifications-unread-count">
            {Math.min(unreadCount, 9)}
          </span>
        ) : null}
      </Button>

      {open ? (
        <Card className="notifications-panel" data-testid="notifications-panel">
          <div className="notifications-head">
            <div>
              <div className="section-label">Central de alertas</div>
              <strong>Atualizacoes do sistema</strong>
            </div>
            {unreadCount > 0 ? (
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary shadow-none">
                {unreadCount} novas
              </Badge>
            ) : null}
          </div>

          <div className="notifications-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={markAllNotificationsRead}>
              Marcar todas
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearNotifications}>
              Limpar
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="notifications-empty">
              <div className="empty-icon">!</div>
              <h3>Nenhum alerta ainda</h3>
              <p>Conquistas, sessoes concluidas e atualizacoes importantes vao aparecer aqui.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`notifications-item${entry.read ? '' : ' is-unread'}`}
                  onClick={() => markNotificationRead(entry.id)}
                >
                  <span className={`notifications-item-dot notifications-item-dot-${entry.kind}`} />
                  <span className="notifications-item-copy">
                    <strong>{entry.title}</strong>
                    {entry.description ? <span>{entry.description}</span> : null}
                  </span>
                  <span className="notifications-item-time">{formatRelativeDate(entry.createdAt)}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
