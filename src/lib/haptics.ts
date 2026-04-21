/**
 * Haptic feedback utility using the navigator.vibrate() API.
 * Patterns:
 * - light: standard tap on smaller UI elements
 * - medium: standard button click
 * - heavy: significant action (like success/error)
 * - success: rhythmic pulse
 * - error: triple jolt
 */

export const haptic = {
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(45);
    }
  },
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([10, 50, 15]);
    }
  },
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  },
  celebration: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Multiple strong pulses to match the confetti bursts
      navigator.vibrate([60, 40, 60, 40, 100]);
    }
  }
};
