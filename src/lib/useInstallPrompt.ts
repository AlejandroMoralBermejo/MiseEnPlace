'use client';

import { useSyncExternalStore } from 'react';
import { getInstallMode, isIosDevice, type InstallMode } from './install';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Registered at import time: the browser fires this once, often before any page asks for it.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): InstallMode {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return getInstallMode({
    standalone: installed || iosStandalone || window.matchMedia('(display-mode: standalone)').matches,
    canPrompt: deferredPrompt !== null,
    ios: isIosDevice(navigator.userAgent, navigator.maxTouchPoints),
  });
}

export function useInstallMode(): InstallMode | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export async function promptInstall(): Promise<void> {
  if (!deferredPrompt) return;
  const event = deferredPrompt;
  await event.prompt();
  await event.userChoice;
  // The browser only allows each prompt event to be used once.
  deferredPrompt = null;
  notify();
}
