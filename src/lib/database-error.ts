// Driver errors can be nested inside Prisma's metadata or an AggregateError.
function errorCodes(error: unknown, depth = 0, seen = new Set<object>()): Set<string> {
  const codes = new Set<string>();
  if (!error || typeof error !== 'object' || depth > 8 || seen.has(error)) return codes;
  seen.add(error);
  const value = error as Record<string, unknown>;
  for (const key of ['code', 'originalCode', 'kind', 'sqlState']) {
    if (typeof value[key] === 'string') codes.add(value[key]);
  }
  for (const key of ['cause', 'meta', 'driverAdapterError', 'errors']) {
    const nested = Array.isArray(value[key]) ? value[key] : [value[key]];
    for (const item of nested) for (const code of errorCodes(item, depth + 1, seen)) codes.add(code);
  }
  return codes;
}

export function databaseError(error: unknown, configured: boolean) {
  if (!configured) return {
    code: 'DATABASE_NOT_CONFIGURED',
    error: 'DATABASE_URL is missing. Set it in the application runtime environment and restart the app.',
  };
  const codes = errorCodes(error);
  const has = (...values: string[]) => values.some(value => codes.has(value));
  if (has('P2021', 'P2022', '42P01', '42703', 'TableDoesNotExist', 'ColumnNotFound')) return {
    code: 'DATABASE_SCHEMA_OUTDATED',
    error: 'The database schema needs updating. Run bun run db:deploy inside the application container, then restart the app.',
  };
  if (has('P1000', '28P01', '28000', 'AuthenticationFailed')) return {
    code: 'DATABASE_AUTH_FAILED',
    error: 'The database rejected the username or password. Check the credentials in the application DATABASE_URL.',
  };
  if (has('P1003', '3D000', 'DatabaseDoesNotExist')) return {
    code: 'DATABASE_NOT_FOUND',
    error: 'The database named in DATABASE_URL does not exist. Check the database name in the connection string.',
  };
  if (has('P1010', '42501', 'DatabaseAccessDenied')) return {
    code: 'DATABASE_ACCESS_DENIED',
    error: 'The database user does not have the required access. Check its permissions on the application database.',
  };
  if (has('P1011', 'TlsConnectionError')) return {
    code: 'DATABASE_TLS_FAILED',
    error: 'The database TLS connection failed. Check that DATABASE_URL uses the SSL settings required by the database.',
  };
  if (has('P1001', 'P1002', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'DatabaseNotReachable', 'SocketTimeout')) return {
    code: 'DATABASE_UNREACHABLE',
    error: 'Could not connect to the database host. Check DATABASE_URL and that the application and database share a network.',
  };
  return {
    code: 'DATABASE_REQUEST_FAILED',
    error: 'The database request failed. Check the application logs for the specific error.',
  };
}
