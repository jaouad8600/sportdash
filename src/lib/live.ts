"use client";
export function broadcast(channel: string, data?: any) {
  try {
    new BroadcastChannel(channel).postMessage(data ?? Date.now());
  } catch { }
}
export function onBroadcast(channel: string, cb: () => void) {
  try {
    const bc = new BroadcastChannel(channel);
    bc.onmessage = () => cb();
    return () => {
      try {
        bc.close();
      } catch { }
    };
  } catch {
    return () => { };
  }
}
import { useState, useEffect } from "react";

export function useLiveObject<T>(channel: string, initialValue: T): [T, (val: T) => void] {
  const [val, setVal] = useState<T>(initialValue);

  useEffect(() => {
    const bc = new BroadcastChannel(channel);
    bc.onmessage = (ev) => {
      if (ev.data) setVal(ev.data);
    };
    return () => bc.close();
  }, [channel]);

  const update = (newVal: T) => {
    setVal(newVal);
    const bc = new BroadcastChannel(channel);
    bc.postMessage(newVal);
    bc.close();
  };

  return [val, update];
}
