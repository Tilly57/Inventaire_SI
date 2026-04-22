/**
 * @fileoverview Regression guard for audit C2.
 *
 * Background: the auth middleware populates req.user with { userId, email, role }
 * (no `id` key). A long-standing bug had auditHelpers reading `req.user.id`,
 * which meant every call silently produced userId=undefined — createAuditLog
 * then rejected the payload at its validation check and the audit trail was
 * effectively empty.
 *
 * This test pins down the correct shape so the regression cannot come back.
 */

import { jest } from '@jest/globals';

const mockCreateAuditLog = jest.fn();
const mockGetIpAddress = jest.fn(() => '127.0.0.1');
const mockGetUserAgent = jest.fn(() => 'jest');

jest.unstable_mockModule('../auditLog.js', () => ({
  createAuditLog: mockCreateAuditLog,
  getIpAddress: mockGetIpAddress,
  getUserAgent: mockGetUserAgent,
}));

const { logAction, logCreate, logUpdate, logDelete } = await import('../auditHelpers.js');

describe('auditHelpers (audit C2 regression guard)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockReq({ userId = 'u1', email = 'a@b.c', role = 'ADMIN' } = {}) {
    return { user: { userId, email, role } };
  }

  it('reads userId from req.user.userId — never from req.user.id', async () => {
    const req = mockReq({ userId: 'user-42' });
    // Defensively inject an `id` that must be ignored.
    req.user.id = 'IGNORE-ME';

    await logAction('CREATE', 'AssetItem', 'rec-1', req, { newValues: { a: 1 } });

    expect(mockCreateAuditLog).toHaveBeenCalledTimes(1);
    const [payload] = mockCreateAuditLog.mock.calls[0];
    expect(payload.userId).toBe('user-42');
    expect(payload.userId).not.toBe('IGNORE-ME');
  });

  it('skips silently when req.user is missing (system ops / tests)', async () => {
    await logAction('CREATE', 'X', '1', { });
    expect(mockCreateAuditLog).not.toHaveBeenCalled();
  });

  it.each([
    ['logCreate', logCreate, 'CREATE'],
    ['logUpdate', logUpdate, 'UPDATE'],
    ['logDelete', logDelete, 'DELETE'],
  ])('%s forwards userId from req.user.userId', async (_, fn, expectedAction) => {
    const req = mockReq({ userId: 'user-99' });
    const args = expectedAction === 'UPDATE'
      ? ['T', 'r', req, { a: 1 }, { a: 2 }]
      : ['T', 'r', req, { a: 1 }];

    await fn(...args);

    const [payload] = mockCreateAuditLog.mock.calls[0];
    expect(payload.userId).toBe('user-99');
    expect(payload.action).toBe(expectedAction);
  });
});