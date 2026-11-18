/**
 * Public audio utility facade preserving existing soundManager & sound APIs
 * while delegating synthesis to the global theme-aware Web Audio soundEngine.
 */

import { haptics } from './haptics';
import {
  playSoundTap,
  playSoundToggle,
  playSoundCorrect,
  playSoundIncorrect,
  playSoundFlip,
  playSoundCelebration,
  previewUiSoundTheme,
  UI_SOUND_PROFILES,
  getCachedUiSoundTheme,
  applyUiSoundTheme,
  normalizeUiSoundTheme,
  type UiSoundTheme,
  type UiSoundProfileInfo,
} from './soundEngine';

export {
  UI_SOUND_PROFILES,
  getCachedUiSoundTheme,
  applyUiSoundTheme,
  normalizeUiSoundTheme,
  previewUiSoundTheme,
  type UiSoundTheme,
  type UiSoundProfileInfo,
};

export const soundManager = {
  playTap(enabled: boolean) {
    playSoundTap(enabled);
  },

  playToggle(enabled: boolean) {
    playSoundToggle(enabled);
  },

  playCorrect(enabled: boolean) {
    haptics.success();
    playSoundCorrect(enabled);
  },

  playIncorrect(enabled: boolean) {
    haptics.error();
    playSoundIncorrect(enabled);
  },

  playFlip(enabled: boolean) {
    haptics.flip();
    playSoundFlip(enabled);
  },

  playCelebration(enabled: boolean) {
    haptics.celebrate();
    playSoundCelebration(enabled);
  },

  speakWord(text: string, rate: number = 0.9) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('Speech error', e);
    }
  },
};

export const sound = {
  playSuccess: () => soundManager.playCorrect(true),
  playError: () => soundManager.playIncorrect(true),
  playCelebration: () => soundManager.playCelebration(true),
};
