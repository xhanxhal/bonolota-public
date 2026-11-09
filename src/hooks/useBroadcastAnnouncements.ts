import { useState, useEffect, useCallback, useRef } from 'react';

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'update' | 'promotion';
  priority: 'normal' | 'high';
  displayStyle?: 'toast' | 'center_modal';
  targetKey?: string;
  autoDismissSeconds?: number;
  actionUrl?: string;
  actionText?: string;
  createdAt: number;
  active: boolean;
  author?: string;
}

const SEEN_ANNOUNCEMENTS_KEY = 'bonolota_seen_announcements';
const READ_ANNOUNCEMENTS_KEY = 'bonolota_read_announcements';
const DELETED_ANNOUNCEMENTS_KEY = 'bonolota_deleted_announcements';
const USER_KEY_STORAGE = 'bonolota_user_key';

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

function getCurrentUserKey(): string {
  try {
    return (localStorage.getItem(USER_KEY_STORAGE) || '').toUpperCase().trim();
  } catch {
    return '';
  }
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

export function useBroadcastAnnouncements(userKey?: string) {
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activePopup, setActivePopup] = useState<BroadcastAnnouncement | null>(null);
  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const eventSourceRef = useRef<EventSource | null>(null);
  const autoDismissTimerRef = useRef<any>(null);

  // Check Web Notification API support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  const myKey = (userKey || getCurrentUserKey()).toUpperCase().trim();

  // Filter announcements for this user: not deleted, and matches targetKey if specified
  const filterForUser = useCallback((items: BroadcastAnnouncement[]): BroadcastAnnouncement[] => {
    const deletedSet = getStoredIds(DELETED_ANNOUNCEMENTS_KEY);
    return items.filter(item => {
      // Support replies must never appear as broadcast notification popups
      if (item.id.startsWith('anno_reply_') || item.title.includes('সাপোর্ট উত্তর')) return false;
      if (deletedSet.has(item.id)) return false;
      if (!item.active) return false;
      if (item.targetKey && item.targetKey.trim().length > 0) {
        const cleanTarget = item.targetKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const cleanUser = myKey.replace(/[^A-Z0-9]/g, '');
        if (!cleanUser || (!cleanUser.includes(cleanTarget) && !cleanTarget.includes(cleanUser))) {
          return false;
        }
      }
      return true;
    });
  }, [myKey]);

  const calculateUnread = useCallback((items: BroadcastAnnouncement[]) => {
    const readSet = getStoredIds(READ_ANNOUNCEMENTS_KEY);
    const unread = items.filter(item => !readSet.has(item.id)).length;
    setUnreadCount(unread);
  }, []);

  // Check and trigger popup for high-priority or newly pushed announcements
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
          const visible = filterForUser(data.announcements);
          setAnnouncements(visible);
          calculateUnread(visible);
          checkUrgentPopup(visible);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    }
  }, [filterForUser, calculateUnread, checkUrgentPopup]);

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
              const visible = filterForUser(parsed.announcements);
              setAnnouncements(visible);
              calculateUnread(visible);
              checkUrgentPopup(visible);
            } else if (parsed.type === 'announcement' && parsed.data) {
              const newAnno: BroadcastAnnouncement = parsed.data;
              const matches = filterForUser([newAnno]);
              if (matches.length > 0) {
                setAnnouncements(prev => {
                  const filtered = prev.filter(a => a.id !== newAnno.id);
                  const updated = [newAnno, ...filtered];
                  calculateUnread(updated);
                  return updated;
                });

                // Fire sound and push notification
                fireNotification(newAnno);

                // Show popup immediately
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
  }, [fetchActiveAnnouncements, filterForUser, calculateUnread, checkUrgentPopup, fireNotification]);

  // Auto-dismiss timer for popup if autoDismissSeconds is configured
  useEffect(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    if (activePopup && activePopup.autoDismissSeconds && activePopup.autoDismissSeconds > 0) {
      autoDismissTimerRef.current = setTimeout(() => {
        dismissPopup();
      }, activePopup.autoDismissSeconds * 1000);
    }

    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [activePopup]);

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

  // Delete single announcement
  const deleteAnnouncement = (id: string) => {
    const delSet = getStoredIds(DELETED_ANNOUNCEMENTS_KEY);
    delSet.add(id);
    saveStoredIds(DELETED_ANNOUNCEMENTS_KEY, delSet);
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      calculateUnread(updated);
      return updated;
    });
    if (activePopup?.id === id) {
      setActivePopup(null);
    }
  };

  // Clear all announcements
  const clearAllAnnouncements = () => {
    const delSet = getStoredIds(DELETED_ANNOUNCEMENTS_KEY);
    announcements.forEach(a => delSet.add(a.id));
    saveStoredIds(DELETED_ANNOUNCEMENTS_KEY, delSet);
    setAnnouncements([]);
    setUnreadCount(0);
    setActivePopup(null);
  };

  // Dismiss popup
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
    deleteAnnouncement,
    clearAllAnnouncements,
    isPushSupported,
    pushPermission,
    requestPushPermission,
    refreshAnnouncements: fetchActiveAnnouncements,
  };
}
