import { useState, useEffect, useCallback, useRef } from 'react';

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'update' | 'promotion';
  priority: 'normal' | 'high';
  actionUrl?: string;
  actionText?: string;
  createdAt: number;
  active: boolean;
  author?: string;
}

const SEEN_ANNOUNCEMENTS_KEY = 'bonolota_seen_announcements';
const READ_ANNOUNCEMENTS_KEY = 'bonolota_read_announcements';

function getStoredIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function saveStoredIds(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

// Gentle synth audio chime for new announcement alert
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export function useBroadcastAnnouncements() {
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activePopup, setActivePopup] = useState<BroadcastAnnouncement | null>(null);
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Check Web Notification API support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  const calculateUnread = useCallback((items: BroadcastAnnouncement[]) => {
    const readSet = getStoredIds(READ_ANNOUNCEMENTS_KEY);
    const unread = items.filter(item => !readSet.has(item.id)).length;
    setUnreadCount(unread);
  }, []);

  // Check and trigger urgent modal popup for high-priority unseen announcements
  const checkUrgentPopup = useCallback((items: BroadcastAnnouncement[]) => {
    const seenSet = getStoredIds(SEEN_ANNOUNCEMENTS_KEY);
    const urgentUnseen = items.find(item => item.priority === 'high' && item.active && !seenSet.has(item.id));
    if (urgentUnseen) {
      setActivePopup(urgentUnseen);
    }
  }, []);

  // Request browser push notification permission
  const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushSupported) return false;
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        try {
          new Notification('বনলতা নোটিফিকেশন সক্রিয় হয়েছে! 🔔', {
            body: 'এখন থেকে অ্যাডমিনের গুরুত্বপূর্ণ নোটিশ ও আপডেট আপনার ডিভাইসে সরাসরি পাবেন।',
            icon: '/icon.svg',
          });
        } catch {}
        return true;
      }
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
    }
    return false;
  };

  // Trigger web notification
  const fireNotification = useCallback((anno: BroadcastAnnouncement) => {
    playChime();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(anno.title, {
          body: anno.message,
          icon: '/icon.svg',
          badge: '/icon.svg',
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Browser push notification error:', err);
      }
    }
  }, []);

  // Initial fetch of active announcements
  const fetchActiveAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcasts/active');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
          calculateUnread(data.announcements);
          checkUrgentPopup(data.announcements);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  }, [calculateUnread, checkUrgentPopup]);

  // Connect to SSE stream
  useEffect(() => {
    fetchActiveAnnouncements();

    let retryTimeout: any = null;

    function connectSSE() {
      try {
        const es = new EventSource('/api/broadcasts/stream');
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'init' && Array.isArray(parsed.announcements)) {
              setAnnouncements(parsed.announcements);
              calculateUnread(parsed.announcements);
              checkUrgentPopup(parsed.announcements);
            } else if (parsed.type === 'announcement' && parsed.data) {
              const newAnno: BroadcastAnnouncement = parsed.data;
              setAnnouncements(prev => {
                const filtered = prev.filter(a => a.id !== newAnno.id);
                const updated = [newAnno, ...filtered];
                calculateUnread(updated);
                return updated;
              });

              // Fire push notification & sound
              fireNotification(newAnno);

              // If high priority, open popup modal immediately
              if (newAnno.priority === 'high') {
                setActivePopup(newAnno);
              }
            } else if (parsed.type === 'delete' && parsed.data?.id) {
              const delId = parsed.data.id;
              setAnnouncements(prev => {
                const updated = prev.filter(a => a.id !== delId);
                calculateUnread(updated);
                return updated;
              });
              setActivePopup(prev => (prev?.id === delId ? null : prev));
            }
          } catch {}
        };

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          // Reconnect with exponential backoff after 5 seconds
          retryTimeout = setTimeout(connectSSE, 5000);
        };
      } catch {
        retryTimeout = setTimeout(connectSSE, 10000);
      }
    }

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [fetchActiveAnnouncements, calculateUnread, checkUrgentPopup, fireNotification]);

  // Mark single announcement as read
  const markAsRead = (id: string) => {
    const readSet = getStoredIds(READ_ANNOUNCEMENTS_KEY);
    readSet.add(id);
    saveStoredIds(READ_ANNOUNCEMENTS_KEY, readSet);
    calculateUnread(announcements);
  };

  // Mark all announcements as read
  const markAllAsRead = () => {
    const readSet = getStoredIds(READ_ANNOUNCEMENTS_KEY);
    announcements.forEach(a => readSet.add(a.id));
    saveStoredIds(READ_ANNOUNCEMENTS_KEY, readSet);
    setUnreadCount(0);
  };

  // Dismiss urgent popup
  const dismissPopup = () => {
    if (activePopup) {
      const seenSet = getStoredIds(SEEN_ANNOUNCEMENTS_KEY);
      seenSet.add(activePopup.id);
      saveStoredIds(SEEN_ANNOUNCEMENTS_KEY, seenSet);
      markAsRead(activePopup.id);
    }
    setActivePopup(null);
  };

  return {
    announcements,
    unreadCount,
    activePopup,
    dismissPopup,
    markAsRead,
    markAllAsRead,
    isPushSupported,
    pushPermission,
    requestPushPermission,
    refreshAnnouncements: fetchActiveAnnouncements,
  };
}
