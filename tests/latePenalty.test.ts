import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { calculateLatePenalty } from '../src/core/latePenalty';

function getDateFromFixture(name: string): Date {
  const data = JSON.parse(readFileSync(resolve('tests/fixtures/telegram', name), 'utf-8'));
  return new Date(data.message.date * 1000);
}

describe('calculateLatePenalty', () => {
  it('09:04 => ON_TIME', () => {
    const result = calculateLatePenalty(getDateFromFixture('video-note-0904.json'));
    expect(result.rule).toBe('ON_TIME');
    expect(result.penaltyVnd).toBe(0);
  });

  it('09:10 => LATE_MINOR', () => {
    const result = calculateLatePenalty(getDateFromFixture('video-note-0910.json'));
    expect(result.rule).toBe('LATE_MINOR');
    expect(result.penaltyVnd).toBe(30000);
  });

  it('09:45 => LATE_MAJOR', () => {
    const result = calculateLatePenalty(getDateFromFixture('video-note-0945.json'));
    expect(result.rule).toBe('LATE_MAJOR');
    expect(result.penaltyVnd).toBe(100000);
  });

  it('10:05 => LATE_CRITICAL and notify owner', () => {
    const result = calculateLatePenalty(getDateFromFixture('video-note-1005.json'));
    expect(result.rule).toBe('LATE_CRITICAL');
    expect(result.penaltyVnd).toBe(200000);
    expect(result.shouldNotifyOwner).toBe(true);
  });
});
