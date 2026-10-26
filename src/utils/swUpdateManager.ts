// Service Worker Update & Safe Auto-Refresh Manager for Bonolota PWA
import { registerSW } from 'virtual:pwa-register';

type UpdateListener = () => void;

class SWUpdateManager {
  private registration: ServiceWorkerRegistration | null = null;
  private pendingUpdate: boolean = false;
  private listeners: Set<UpdateListener> = new Set();
  private isReloading: boolean = false;
  private updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.init();
    }
  }

  private init() {
    try {
      this.updateSWFn = registerSW({
        immediate: true,
        onNeedRefresh: () => {
          this.setUpdateAvailable();
        },
        onOfflineReady: () => {
          // Ready for offline usage
        },
        onRegisteredSW: (_swUrl, reg) => {
          if (reg) {
            this.registration = reg;

            // Listen for waiting service worker
            if (reg.waiting) {
              this.setUpdateAvailable();
            }

            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.setUpdateAvailable();
                  }
                });
              }
            });

            // Periodically check for updates (every 5 minutes)
            setInterval(() => {
              this.checkForUpdates();
            }, 5 * 60 * 1000);
          }
        },
      });

      // When the service worker changes controller, a new version has taken over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.setUpdateAvailable();
      });

      // Check on reconnection or window refocus
      window.addEventListener('online', () => {
        this.checkForUpdates();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdates();
        }
      });
    } catch (err) {
      console.warn('SW registration warning:', err);
    }
  }

  public checkForUpdates() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (this.registration) {
      this.registration.update().catch(() => {
        // Safe to ignore when offline or fetch fails
      });
    }
  }

  public setUpdateAvailable() {
    this.pendingUpdate = true;
    this.notify();
  }

  public getHasPendingUpdate(): boolean {
    return this.pendingUpdate;
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Update listener error:', e);
      }
    });
  }

  public async reloadAndApplyUpdate(): Promise<void> {
    if (this.isReloading) return;
    this.isReloading = true;
    try {
      if (this.updateSWFn) {
        await this.updateSWFn(true);
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }
}

export const swUpdateManager = new SWUpdateManager();
