import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from './manifest';

describe('web app manifest', () => {
  const app = manifest();

  it('opens as a standalone app on the calendar', () => {
    expect(app.name).toBe('MiseEnPlace');
    expect(app.short_name).toBe('MiseEnPlace');
    expect(app.start_url).toBe('/calendar');
    expect(app.display).toBe('standalone');
  });

  it('declares the icon sizes browsers require', () => {
    const sizes = app.icons?.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(app.icons?.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('points only at icon files that exist', () => {
    for (const icon of app.icons ?? []) {
      expect(existsSync(join(process.cwd(), 'public', icon.src))).toBe(true);
    }
  });
});
