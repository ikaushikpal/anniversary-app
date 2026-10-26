import { useEffect, useRef, useState } from "react";

export default function useAudio(src, initialVolume = 0.6) {
  const audioRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(initialVolume);

  const fadeIntervalRef = useRef(null);
  const previousVolumeRef = useRef(initialVolume);
  const isDuckedRef = useRef(false);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audio.preload = "auto";
    audioRef.current = audio;

    const onCanPlay = () => setIsReady(true);
    const onError = () => setIsReady(false);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      audio.pause();
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [src]);

  const fadeTo = (target, duration = 800) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const safeTarget = Math.max(0, Math.min(1, target));
    const steps = 20;
    const stepTime = duration / steps;
    const start = audio.volume;
    const delta = (safeTarget - start) / steps;
    let current = 0;

    fadeIntervalRef.current = setInterval(() => {
      current += 1;
      audio.volume = Math.max(0, Math.min(1, start + delta * current));
      if (current >= steps) {
        audio.volume = safeTarget;
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, stepTime);
  };

  const duck = (isDucked) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isDucked) {
      // Remember current volume before ducking
      if (!isDuckedRef.current) {
        previousVolumeRef.current = volume;
        isDuckedRef.current = true;
      }
      // Make background sound 0.1 so the short sound can be heard clearly
      fadeTo(0.1, 200);
    } else {
      isDuckedRef.current = false;
      // Resume to previous volume
      const target = previousVolumeRef.current ?? volume ?? initialVolume;
      fadeTo(target, 500);
    }
  };

  const play = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      fadeTo(volume, 1200);
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio play failed", error);
    }
  };

  const pause = (immediate = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (immediate) {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      audio.pause();
      setIsPlaying(false);
      return;
    }
    fadeTo(0, 600);
    setTimeout(() => {
      audio.pause();
      setIsPlaying(false);
    }, 650);
  };

  const updateVolume = (nextVolume) => {
    setVolume(nextVolume);
    previousVolumeRef.current = nextVolume;
    const audio = audioRef.current;
    if (!audio) return;
    if (!isDuckedRef.current) {
      audio.volume = nextVolume;
    }
  };

  return {
    isReady,
    isPlaying,
    volume,
    play,
    pause,
    updateVolume,
    fadeTo,
    duck
  };
}
