/**
 * setup.ts
 *
 * Test setup: applies the real D1 migrations from `migrations/*.sql` against
 * the cloudflare:test in-memory D1 before each test. Two transforms happen
 * on the way in:
 *
 *   1. Data statements (INSERT/UPDATE) are dropped. Tests start empty;
 *      production seed data would slow things down and conflict with
 *      tests that count rows.
 *   2. FK `REFERENCES … ON DELETE …` clauses are stripped. The cloudflare
 *      vitest pool doesn't honor `PRAGMA foreign_keys = OFF`, so circular
 *      FKs (users.invite_code ↔ invite_codes.created_by_user_id) break
 *      DROP TABLE in `dropAllTables()`. Real prod migrations keep the FKs.
 *
 * Loading the SQL files at runtime means new migrations are picked up
 * automatically — no hand-maintained mirror in this file.
 */
import { env } from 'cloudflare:test'

/** Raw SQL files loaded at build time. Key = full path, value = file content. */
const MIGRATION_FILES = import.meta.glob('../../../../migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Strip `REFERENCES <table>(<col>) [ON DELETE …] [ON UPDATE …]` clauses. */
function stripForeignKeys(stmt: string): string {
  return stmt.replace(
    /\s*REFERENCES\s+\w+\s*\([^)]+\)(?:\s+ON\s+(?:DELETE|UPDATE)\s+(?:SET\s+(?:NULL|DEFAULT)|CASCADE|RESTRICT|NO\s+ACTION))*/gi,
    '',
  )
}

/**
 * Strip block comments and line comments from SQL. Must run BEFORE splitting
 * on `;` — a `;` inside a comment would otherwise land mid-comment and chop
 * the following statement's head, dropping it.
 */
export function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--[^\n]*/g, '')
}

/**
 * Split a migration file into individual statements, keeping only schema
 * ones (CREATE/ALTER/DROP TABLE/INDEX). Comments and blank lines are
 * dropped. INSERT/UPDATE statements (seed data) are skipped.
 */
export function extractSchemaStatements(sql: string): string[] {
  return stripSqlComments(sql)
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => {
      const head = s.slice(0, 60).toUpperCase()
      return (
        head.startsWith('CREATE TABLE') ||
        head.startsWith('CREATE INDEX') ||
        head.startsWith('CREATE UNIQUE') ||
        head.startsWith('ALTER TABLE') ||
        head.startsWith('DROP TABLE') ||
        head.startsWith('DROP INDEX')
      )
    })
    .map(stripForeignKeys)
}

/** Cached list of schema statements, ordered by migration filename. */
const SCHEMA_STATEMENTS: string[] = Object.entries(MIGRATION_FILES)
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([, sql]) => extractSchemaStatements(sql))

/** Table names referenced by CREATE TABLE, in creation order. */
const CREATED_TABLES: string[] = SCHEMA_STATEMENTS.flatMap((s) => {
  const m = /^CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i.exec(s)
  return m ? [m[1]] : []
})

/** Test invite code seeded after migration. */
export const TEST_INVITE_CODE = 'TEST-BETA'

/**
 * Apply the real D1 migrations (schema-only, FKs stripped) to the test DB.
 * Call from beforeEach.
 */
export async function applyMigration(): Promise<void> {
  const db = env.DB
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.prepare(stmt).run()
  }
  // Seed a test invite code for registration tests.
  await db
    .prepare(
      `INSERT OR IGNORE INTO invite_codes (code, label, verification_level, is_active) VALUES (?, ?, ?, ?)`,
    )
    .bind(TEST_INVITE_CODE, 'Test Beta', 45, 1)
    .run()
}

/**
 * Drop every table created by the migrations, in reverse creation order
 * so child tables go first. FKs are stripped from the test schema so
 * order isn't strictly required, but keeping the reverse order is cheap
 * insurance.
 */
export async function dropAllTables(): Promise<void> {
  const db = env.DB
  for (const table of [...CREATED_TABLES].reverse()) {
    await db.prepare(`DROP TABLE IF EXISTS ${table}`).run()
  }
}

/** Helper: make a request to the Hono app with proper env bindings. */
export function makeRequest(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost${path}`, init)
}
