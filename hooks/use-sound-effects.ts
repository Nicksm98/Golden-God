import { useEffect, useRef, useCallback } from "react";

export type SoundEffect = "card-flip" | "drink" | "turn-chime" | "role-assigned";

export function useSoundEffects() {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Create AudioContext on mount
    audioContext.current = new (window.AudioContext || (window as never)["webkitAudioContext"])();
    
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const playSound = useCallback((type: SoundEffect) => {
    if (!audioContext.current) return;

    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Define different sounds
    switch (type) {
      case "card-flip":
        // Quick swoosh sound
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;

      case "drink":
        // Alert sound
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;

      case "turn-chime":
        // Pleasant notification
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case "role-assigned":
        // Fanfare
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
        break;
    }
  }, []);

  return { playSound };
}
