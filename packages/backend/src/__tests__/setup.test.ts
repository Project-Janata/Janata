/**
 * setup.test.ts — Unit tests for the migration-parsing helpers in setup.ts.
 *
 * Regression guard: a `;` inside a `--` comment must not break statement
 * boundaries. Stripping comments before splitting on `;` is what prevents
 * the following CREATE TABLE from losing its head and being dropped.
 */
import { describe, it, expect } from 'vitest'
import { extractSchemaStatements, stripSqlComments } from './setup'

describe('stripSqlComments', () => {
  it('removes -- line comments, including any semicolons inside them', () => {
    const sql = `CREATE TABLE a (id TEXT); -- drop this; and this
CREATE TABLE b (id TEXT);`
    const out = stripSqlComments(sql)
    expect(out).not.toContain('drop this')
    expect(out).toContain('CREATE TABLE a')
    expect(out).toContain('CREATE TABLE b')
  })

  it('removes /* */ block comments spanning lines', () => {
    const sql = `/* header;
 with a semicolon */
CREATE TABLE a (id TEXT);`
    const out = stripSqlComments(sql)
    expect(out).not.toContain('header')
    expect(out).toContain('CREATE TABLE a')
  })
})

describe('extractSchemaStatements', () => {
  it('still yields correct CREATE TABLE statements when a -- comment contains a semicolon', () => {
    const sql = `
-- migration 0024: add boards; backfill later
CREATE TABLE IF NOT EXISTS boards (
  id    TEXT PRIMARY KEY,
  title TEXT NOT NULL
);

-- note: this index matters; keep it
CREATE INDEX IF NOT EXISTS idx_boards_title ON boards(title);
`
    const statements = extractSchemaStatements(sql)
    expect(statements).toHaveLength(2)
    expect(statements[0]).toMatch(/^CREATE TABLE IF NOT EXISTS boards/)
    expect(statements[0]).toContain('title TEXT NOT NULL')
    expect(statements[1]).toMatch(/^CREATE INDEX IF NOT EXISTS idx_boards_title/)
  })

  it('drops INSERT/UPDATE seed statements and strips FK clauses', () => {
    const sql = `
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  invite_code TEXT REFERENCES invite_codes(code) ON DELETE SET NULL
);
INSERT INTO users (id) VALUES ('u-1');
UPDATE users SET id = 'u-2';
`
    const statements = extractSchemaStatements(sql)
    expect(statements).toHaveLength(1)
    expect(statements[0]).toContain('CREATE TABLE users')
    expect(statements[0]).not.toContain('REFERENCES')
    expect(statements[0]).not.toContain('ON DELETE')
  })
})
