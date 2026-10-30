export type InstallMode = 'installed' | 'prompt' | 'ios' | 'manual';

export function getInstallMode({
  standalone,
  canPrompt,
  ios,
}: {
  standalone: boolean;
  canPrompt: boolean;
  ios: boolean;
}): InstallMode {
  if (standalone) return 'installed';
  if (canPrompt) return 'prompt';
  return ios ? 'ios' : 'manual';
}

// iPadOS identifies itself as a Mac; the touch points give it away.
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}
