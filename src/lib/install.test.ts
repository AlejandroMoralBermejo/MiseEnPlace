import { describe, expect, it } from 'vitest';
import { getInstallMode, isIosDevice } from './install';

describe('getInstallMode', () => {
  it('offers nothing once the app is installed', () => {
    expect(getInstallMode({ standalone: true, canPrompt: true, ios: false })).toBe('installed');
  });

  it('uses the browser prompt when it is available', () => {
    expect(getInstallMode({ standalone: false, canPrompt: true, ios: false })).toBe('prompt');
  });

  it('shows the Safari steps on iOS', () => {
    expect(getInstallMode({ standalone: false, canPrompt: false, ios: true })).toBe('ios');
  });

  it('falls back to the browser menu steps', () => {
    expect(getInstallMode({ standalone: false, canPrompt: false, ios: false })).toBe('manual');
  });
});

describe('isIosDevice', () => {
  it('detects an iPhone', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true);
  });

  it('detects an iPad reporting itself as a Mac', () => {
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
  });

  it('does not confuse a real Mac or Android', () => {
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5)).toBe(false);
  });
});
