import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { decideRoute } from '../../src/router/decision';

function loadFixture(name: string) {
  const path = resolve('tests/fixtures/telegram', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('router fixture simulation', () => {
  it('routes /start to command handler', () => {
    expect(decideRoute(loadFixture('start.json'))).toBe('COMMAND_HANDLER');
  });

  it('routes unauthorized fixture command to command handler (auth handled downstream)', () => {
    expect(decideRoute(loadFixture('unauthorized.json'))).toBe('COMMAND_HANDLER');
  });

  it('routes photo with caption to intake branch', () => {
    expect(decideRoute(loadFixture('photo-with-caption.json'))).toBe('INTAKE_PHOTO_WITH_CAPTION');
  });

  it('routes photo without caption to validation branch', () => {
    expect(decideRoute(loadFixture('photo-no-caption.json'))).toBe('INTAKE_PHOTO_NO_CAPTION');
  });

  it('routes video note to attendance branch', () => {
    expect(decideRoute(loadFixture('video-note.json'))).toBe('ATTENDANCE_VIDEO_NOTE');
  });

  it('routes callback query to callback handler', () => {
    expect(decideRoute(loadFixture('callback-query.json'))).toBe('CALLBACK_HANDLER');
  });
});
