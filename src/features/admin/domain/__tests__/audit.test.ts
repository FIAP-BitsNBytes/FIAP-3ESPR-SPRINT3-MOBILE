import { parseAuditLog, parseAuditLogs } from '../audit';

const validRow = {
  id: 'log-1',
  executed_at: '2026-05-07T14:30:00.000Z',
  table_name: 'profiles',
  action: 'UPDATE',
  actor_role: 'ADMIN',
  old_data: { name: 'Old Name' },
  new_data: { name: 'New Name' },
};

describe('parseAuditLog', () => {
  it('parses a valid row into an AuditLogEntry', () => {
    expect(parseAuditLog(validRow)).toEqual({
      id: 'log-1',
      executed_at: '2026-05-07T14:30:00.000Z',
      table_name: 'profiles',
      action: 'UPDATE',
      actor_role: 'ADMIN',
      old_data: { name: 'Old Name' },
      new_data: { name: 'New Name' },
    });
  });

  it('accepts null old_data and new_data', () => {
    const row = { ...validRow, old_data: null, new_data: null };

    expect(parseAuditLog(row)).toEqual({ ...row });
  });

  it('throws when the row is not an object', () => {
    expect(() => parseAuditLog('not-an-object')).toThrow(/esperado um objeto/);
    expect(() => parseAuditLog(null)).toThrow(/esperado um objeto/);
    expect(() => parseAuditLog(undefined)).toThrow(/esperado um objeto/);
    expect(() => parseAuditLog([validRow])).toThrow(/esperado um objeto/);
  });

  it('throws when "id" is missing or not a string', () => {
    const { id, ...withoutId } = validRow;
    expect(() => parseAuditLog(withoutId)).toThrow(/"id"/);
    expect(() => parseAuditLog({ ...validRow, id: 123 })).toThrow(/"id"/);
    expect(() => parseAuditLog({ ...validRow, id: '' })).toThrow(/"id"/);
  });

  it('throws when "executed_at" is missing or not a string', () => {
    const { executed_at, ...rest } = validRow;
    expect(() => parseAuditLog(rest)).toThrow(/"executed_at"/);
    expect(() => parseAuditLog({ ...validRow, executed_at: 12345 })).toThrow(/"executed_at"/);
  });

  it('throws when "table_name" is missing or not a string', () => {
    const { table_name, ...rest } = validRow;
    expect(() => parseAuditLog(rest)).toThrow(/"table_name"/);
    expect(() => parseAuditLog({ ...validRow, table_name: null })).toThrow(/"table_name"/);
  });

  it('throws when "action" is missing or has an unexpected value', () => {
    const { action, ...rest } = validRow;
    expect(() => parseAuditLog(rest)).toThrow(/"action"/);
    expect(() => parseAuditLog({ ...validRow, action: 'PATCH' })).toThrow(/"action"/);
    expect(() => parseAuditLog({ ...validRow, action: 123 })).toThrow(/"action"/);
  });

  it('throws when "actor_role" is missing or not a string', () => {
    const { actor_role, ...rest } = validRow;
    expect(() => parseAuditLog(rest)).toThrow(/"actor_role"/);
    expect(() => parseAuditLog({ ...validRow, actor_role: '' })).toThrow(/"actor_role"/);
  });

  it('throws when "old_data" or "new_data" are not an object or null', () => {
    expect(() => parseAuditLog({ ...validRow, old_data: 'invalid' })).toThrow(/"old_data"/);
    expect(() => parseAuditLog({ ...validRow, old_data: ['array'] })).toThrow(/"old_data"/);
    expect(() => parseAuditLog({ ...validRow, new_data: 42 })).toThrow(/"new_data"/);
  });

  it.each(['INSERT', 'UPDATE', 'DELETE'] as const)('accepts "%s" as a valid action', action => {
    expect(parseAuditLog({ ...validRow, action }).action).toBe(action);
  });
});

describe('parseAuditLogs', () => {
  it('parses an array of valid rows', () => {
    const rows = [validRow, { ...validRow, id: 'log-2', action: 'INSERT' as const }];

    const result = parseAuditLogs(rows);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('log-1');
    expect(result[1].id).toBe('log-2');
    expect(result[1].action).toBe('INSERT');
  });

  it('throws when the input is not an array', () => {
    expect(() => parseAuditLogs({ not: 'an array' })).toThrow(/esperado um array/);
    expect(() => parseAuditLogs(null)).toThrow(/esperado um array/);
  });

  it('throws when any row in the array is invalid', () => {
    expect(() => parseAuditLogs([validRow, { ...validRow, action: 'INVALID' }])).toThrow(/"action"/);
  });

  it('returns an empty array when given an empty array', () => {
    expect(parseAuditLogs([])).toEqual([]);
  });
});
