import confetti from 'canvas-confetti';

interface ConfettiOptions {
  isPerfect?: boolean;
  isHighScore?: boolean;
}

/**
 * Fires an immersive, celebratory confetti shower overlay.
 * Uses high zIndex (9999) so it overlays across modals, headers, and screens.
 */
export function fireCelebrationConfetti(options?: ConfettiOptions): void {
  try {
    const isPerfect = options?.isPerfect ?? false;
    const isHighScore = options?.isHighScore ?? true;

    const festiveColors = [
      '#10b981', // emerald
      '#06b6d4', // cyan
      '#f59e0b', // amber
      '#ec4899', // pink
      '#8b5cf6', // purple
      '#3b82f6', // blue
      '#eab308', // gold
    ];

    const goldColors = ['#ffd700', '#f59e0b', '#eab308', '#fef08a', '#10b981', '#ffffff'];

    // Stage 1: Immediate Left & Right Cannons
    confetti({
      particleCount: isPerfect ? 70 : 50,
      angle: 60,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0.05, y: 0.75 },
      colors: isPerfect ? goldColors : festiveColors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

    confetti({
      particleCount: isPerfect ? 70 : 50,
      angle: 120,
      spread: 65,
      startVelocity: 55,
      origin: { x: 0.95, y: 0.75 },
      colors: isPerfect ? goldColors : festiveColors,
      zIndex: 9999,
      disableForReducedMotion: true,
    });

    // Stage 2: Central fountain burst (t + 180ms)
    setTimeout(() => {
      try {
        confetti({
          particleCount: isPerfect ? 90 : 60,
          angle: 90,
          spread: 100,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.65 },
          colors: isPerfect ? goldColors : festiveColors,
          zIndex: 9999,
          disableForReducedMotion: true,
        });
      } catch (err) {
        console.debug('Confetti burst error', err);
      }
    }, 180);

    // Stage 3: Second crossing volley for high scores (t + 400ms)
    if (isHighScore) {
      setTimeout(() => {
        try {
          confetti({
            particleCount: 45,
            angle: 70,
            spread: 60,
            startVelocity: 50,
            origin: { x: 0.15, y: 0.7 },
            colors: festiveColors,
            zIndex: 9999,
            disableForReducedMotion: true,
          });

          confetti({
            particleCount: 45,
            angle: 110,
            spread: 60,
            startVelocity: 50,
            origin: { x: 0.85, y: 0.7 },
            colors: festiveColors,
            zIndex: 9999,
            disableForReducedMotion: true,
          });
        } catch (err) {
          console.debug('Confetti crossing error', err);
        }
      }, 400);
    }

    // Stage 4: Cascading confetti shower for 2.5 seconds if high score/perfect
    if (isHighScore) {
      const duration = isPerfect ? 3200 : 2200;
      const animationEnd = Date.now() + duration;

      const showerInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(showerInterval);
          return;
        }

        const particleCount = Math.round(25 * (timeLeft / duration));
        
        // Random raining positions near the top
        confetti({
          particleCount,
          startVelocity: 25,
          spread: 360,
          ticks: 80,
          origin: { 
            x: Math.random() * 0.8 + 0.1, 
            y: Math.random() * 0.3 
          },
          colors: isPerfect ? goldColors : festiveColors,
          gravity: 0.8,
          scalar: 0.9,
          zIndex: 9999,
          disableForReducedMotion: true,
        });
      }, 350);
    }
  } catch (e) {
    console.debug('Confetti overall error', e);
  }
}

export const triggerConfetti = fireCelebrationConfetti;
