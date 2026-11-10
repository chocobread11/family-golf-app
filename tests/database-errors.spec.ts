import { test, expect } from '@playwright/test';
import { databaseError } from '../src/lib/database-error';

test('database errors distinguish missing migrations from invalid credentials and network failures', () => {
  const cases = [
    [{ code: 'P2021' }, 'DATABASE_SCHEMA_OUTDATED'],
    [{ code: 'P2022' }, 'DATABASE_SCHEMA_OUTDATED'],
    [{ code: 'P2010', meta: { code: '42P01' } }, 'DATABASE_SCHEMA_OUTDATED'],
    [{ meta: { driverAdapterError: { cause: { originalCode: '28P01', kind: 'AuthenticationFailed' } } } }, 'DATABASE_AUTH_FAILED'],
    [{ code: 'P1000' }, 'DATABASE_AUTH_FAILED'],
    [{ code: '3D000' }, 'DATABASE_NOT_FOUND'],
    [{ code: '42501' }, 'DATABASE_ACCESS_DENIED'],
    [{ cause: { kind: 'TlsConnectionError' } }, 'DATABASE_TLS_FAILED'],
    [new AggregateError([Object.assign(new Error(), { code: 'ECONNREFUSED' })]), 'DATABASE_UNREACHABLE'],
    [{ code: 'ENOTFOUND' }, 'DATABASE_UNREACHABLE'],
  ] as const;
  for (const [error, code] of cases) expect(databaseError(error, true).code).toBe(code);
});

test('missing configuration and unknown failures do not expose raw connection details', () => {
  expect(databaseError(new Error('raw private connection details'), false).code).toBe('DATABASE_NOT_CONFIGURED');
  const error = new Error('postgresql://user:private-password@database/private-db');
  const result = databaseError(error, true);
  expect(result.code).toBe('DATABASE_REQUEST_FAILED');
  expect(JSON.stringify(result)).not.toContain('private-password');
  const circular: { cause?: unknown } = {};
  circular.cause = circular;
  expect(databaseError(circular, true).code).toBe('DATABASE_REQUEST_FAILED');
});
