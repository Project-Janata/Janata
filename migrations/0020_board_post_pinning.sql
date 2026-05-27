-- 0020_board_post_pinning.sql
-- Adds pinning to board_posts. Pinned posts sort first in board listings.
--
-- Tier 2 per migrations/README.md (board_posts is disposable), but using
-- additive ALTER here anyway so we don't drop user-visible data even
-- though the table holds no real users yet.
--
-- pinned_at  - timestamp when pinned (NULL means not pinned)
-- pinned_by  - FK to users(id), the sevak/admin who pinned it
--
-- The new ORDER BY in listBoardPosts is
--   (pinned_at IS NOT NULL) DESC, pinned_at DESC, created_at DESC
-- which puts pinned posts first.
--
-- IMPORTANT: keep comments free of literal semicolons.
-- The test setup in src/__tests__/setup.ts splits each migration on the
-- semicolon character before filtering by statement head, so a semicolon
-- in a comment desyncs the statement parser and silently drops the
-- ALTER that follows it.

ALTER TABLE board_posts ADD COLUMN pinned_at TEXT;
ALTER TABLE board_posts ADD COLUMN pinned_by TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_board_posts_board_pinned_created
  ON board_posts(board_id, pinned_at DESC, created_at DESC);
