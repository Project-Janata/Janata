-- 0019_boards.sql
-- Real board storage for center and event conversations.

CREATE TABLE IF NOT EXISTS boards (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('center', 'event')),
  parent_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(type, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_boards_parent
  ON boards(type, parent_id);

CREATE TABLE IF NOT EXISTS board_posts (
  id          TEXT PRIMARY KEY,
  board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  image_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_board_posts_board_created
  ON board_posts(board_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_posts_author
  ON board_posts(author_id);

CREATE TABLE IF NOT EXISTS board_post_replies (
  post_id         TEXT PRIMARY KEY REFERENCES board_posts(id) ON DELETE CASCADE,
  parent_post_id  TEXT NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_board_post_replies_parent
  ON board_post_replies(parent_post_id);

CREATE TABLE IF NOT EXISTS board_post_reactions (
  post_id     TEXT NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_board_post_reactions_post
  ON board_post_reactions(post_id);
