/**
 * Mobile Haptic Feedback Engine using navigator.vibrate
 * 
 * Provides distinct, tactile vibration responses on mobile devices:
 * - Flashcard flips (subtle crisp mechanical flip sensation)
 * - Quiz answers (distinct positive double-pulse for correct, sharp warning vibration for wrong)
 * - Button interactions & tabs (light tactile tap)
 * - Toggles & favorites (tactile bookmark snap)
 * - Celebrations & completion (rewarding rhythmic sequence)
 * 
 * Safe fallbacks for unsupported browsers, desktop environments,
 * and respects user preference from app settings.
 */
import { storage } from './storage';

export const isHapticsSupported = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

/**
 * Triggers a vibration pattern if supported and enabled in user settings.
 * Returns true if vibration was triggered, false otherwise.
 */
export function triggerHaptic(pattern: number | number[]): boolean {
  if (!isHapticsSupported()) return false;
  try {
    const settings = storage.getSettings();
    if (settings.hapticsEnabled === false) {
      return false;
    }
    return navigator.vibrate(pattern);
  } catch {
    // Non-fatal if browser blocks or restricts vibration
    return false;
  }
}

export const haptics = {
  /**
   * Subtle light tap (10ms) - for standard buttons, tabs, quiz option select, close modal
   */
  tap: () => triggerHaptic(10),

  /**
   * Micro-tick (8ms) - for filter chips, tags, fast scrolling taps
   */
  selection: () => triggerHaptic(8),

  /**
   * Flashcard Flip sensation ([14, 28, 14]) - simulates the tactile physical turn of a flashcard
   */
  flip: () => triggerHaptic([14, 28, 14]),

  /**
   * Correct Answer / Mastered Word ([20, 50, 35]) - upbeat, crisp double vibration
   */
  success: () => triggerHaptic([20, 50, 35]),

  /**
   * Wrong Answer / Needs Practice ([45, 60, 45]) - distinctive error rumble
   */
  error: () => triggerHaptic([45, 60, 45]),

  /**
   * Toggle / Favorite Star / Bookmark (18ms) - tactile switch snap
   */
  toggle: () => triggerHaptic(18),

  /**
   * Celebration / Perfect score / Deck completed ([30, 60, 30, 60, 45])
   */
  celebrate: () => triggerHaptic([30, 60, 30, 60, 45]),

  /**
   * Trigger any custom vibration pattern
   */
  custom: (pattern: number | number[]) => triggerHaptic(pattern),

  /**
   * Check whether device supports navigator.vibrate
   */
  isSupported: isHapticsSupported,
};

export default haptics;
