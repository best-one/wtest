-- 可选：把表单落到 Cloudflare D1
-- 创建：npx wrangler d1 create shopsite-forms
-- 建表：npx wrangler d1 execute shopsite-forms --file=./schema.sql
-- 绑定：Pages Dashboard → Settings → Functions → D1 database bindings，变量名填 DB
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  message     TEXT    NOT NULL,
  source      TEXT,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_created_at
  ON contact_submissions (created_at DESC);

-- 若已按旧版建表，补一列：
-- ALTER TABLE contact_submissions ADD COLUMN source TEXT;
