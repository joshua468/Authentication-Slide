"use client";

import { useCallback, useEffect, useState } from "react";

export function useCountdown(initialSeconds = 30, initialValue = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialValue);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(
      () => setSecondsLeft((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const start = useCallback(
    (seconds = initialSeconds) => {
      setSecondsLeft(seconds);
    },
    [initialSeconds]
  );

  const label = `0:${String(secondsLeft).padStart(2, "0")}`;

  return {
    secondsLeft,
    isCooldown: secondsLeft > 0,
    label,
    start,
  };
}