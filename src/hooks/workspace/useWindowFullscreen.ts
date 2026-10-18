"use client";

import { useCallback, useEffect, useState } from "react";

export function useWindowFullscreen() {
  const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

  const toggleWindowFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsWindowFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsWindowFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsWindowFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return { isWindowFullscreen, toggleWindowFullscreen };
}
