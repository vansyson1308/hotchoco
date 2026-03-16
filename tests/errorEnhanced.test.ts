import { describe, it, expect } from 'vitest';
import { toVietnameseErrorMessage, getErrorSeverity, buildErrorLogPayload, HotChocoError } from '../src/core/error.js';
import type { HotChocoErrorCode } from '../src/core/error.js';

describe('Enhanced Error Module', () => {
  describe('new error codes', () => {
    const newCodes: HotChocoErrorCode[] = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'RATE_LIMITED',
      'EXTERNAL_SERVICE_DOWN',
      'VALIDATION_FAILED',
      'PERMISSION_DENIED',
      'QUOTA_EXCEEDED',
      'DB_CONNECTION_LOST',
    ];

    it.each(newCodes)('%s has a Vietnamese message', (code) => {
      const msg = toVietnameseErrorMessage(code);
      expect(msg).toBeTruthy();
      expect(msg).not.toBe(toVietnameseErrorMessage('INTERNAL_ERROR'));
    });

    it.each(newCodes)('%s has a severity level', (code) => {
      const severity = getErrorSeverity(code);
      expect(['CRITICAL', 'ERROR', 'WARN', 'INFO']).toContain(severity);
    });
  });

  describe('severity mapping', () => {
    it('DB_CONNECTION_LOST is CRITICAL', () => {
      expect(getErrorSeverity('DB_CONNECTION_LOST')).toBe('CRITICAL');
    });

    it('RATE_LIMITED is INFO', () => {
      expect(getErrorSeverity('RATE_LIMITED')).toBe('INFO');
    });

    it('DB_ERROR is ERROR', () => {
      expect(getErrorSeverity('DB_ERROR')).toBe('ERROR');
    });
  });

  describe('buildErrorLogPayload with severity', () => {
    it('uses error code severity instead of hardcoded ERROR', () => {
      const payload = buildErrorLogPayload({
        errorCode: 'RATE_LIMITED',
        workflowName: 'test',
      });
      expect(payload.level).toBe('INFO');
    });

    it('CRITICAL errors get CRITICAL level', () => {
      const payload = buildErrorLogPayload({
        errorCode: 'DB_CONNECTION_LOST',
        workflowName: 'test',
      });
      expect(payload.level).toBe('CRITICAL');
    });
  });

  describe('HotChocoError class', () => {
    it('creates error with code and default message', () => {
      const err = new HotChocoError('UNAUTHORIZED');
      expect(err.code).toBe('UNAUTHORIZED');
      expect(err.message).toBe(toVietnameseErrorMessage('UNAUTHORIZED'));
      expect(err.name).toBe('HotChocoError');
    });

    it('creates error with custom message', () => {
      const err = new HotChocoError('DB_ERROR', 'Connection pool exhausted');
      expect(err.message).toBe('Connection pool exhausted');
      expect(err.userMessage).toBe(toVietnameseErrorMessage('DB_ERROR'));
    });

    it('exposes severity', () => {
      const err = new HotChocoError('DB_CONNECTION_LOST');
      expect(err.severity).toBe('CRITICAL');
    });

    it('carries context', () => {
      const err = new HotChocoError('INTERNAL_ERROR', 'bad', { shopId: '123' });
      expect(err.context).toEqual({ shopId: '123' });
    });

    it('is instanceof Error', () => {
      const err = new HotChocoError('INTERNAL_ERROR');
      expect(err).toBeInstanceOf(Error);
    });
  });
});
