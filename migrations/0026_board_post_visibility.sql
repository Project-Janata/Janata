-- 0026_board_post_visibility.sql
-- Adds public signed-in feed posts alongside existing center and event board posts.

PRAGMA foreign_keys = OFF;

CREATE TABLE board_posts_new (
  id          TEXT PRIMARY KEY,
  board_id    TEXT REFERENCES boards(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  image_url   TEXT,
  visibility  TEXT NOT NULL DEFAULT 'board'
    CHECK (visibility IN ('board', 'public_signed_in', 'public_open')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT,
  pinned_at   TEXT,
  pinned_by   TEXT REFERENCES users(id),
  CHECK (
    (visibility = 'board' AND board_id IS NOT NULL)
    OR
    (visibility IN ('public_signed_in', 'public_open') AND board_id IS NULL)
  )
);

INSERT INTO board_posts_new (
  id,
  board_id,
  author_id,
  body,
  image_url,
  visibility,
  created_at,
  updated_at,
  deleted_at,
  pinned_at,
  pinned_by
)
SELECT
  id,
  board_id,
  author_id,
  body,
  image_url,
  'board',
  created_at,
  updated_at,
  deleted_at,
  pinned_at,
  pinned_by
FROM board_posts;

DROP TABLE board_posts;

ALTER TABLE board_posts_new RENAME TO board_posts;

CREATE INDEX IF NOT EXISTS idx_board_posts_board_created
  ON board_posts(board_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_posts_author
  ON board_posts(author_id);

CREATE INDEX IF NOT EXISTS idx_board_posts_board_pinned_created
  ON board_posts(board_id, pinned_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_posts_public_created
  ON board_posts(visibility, created_at DESC)
  WHERE deleted_at IS NULL;

PRAGMA foreign_keys = ON;
