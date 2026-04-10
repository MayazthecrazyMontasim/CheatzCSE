-- schema/init.sql
-- Cloudflare D1 (SQLite) Schema for Edge Educational Platform
-- Run once via: wrangler d1 execute edu_platform_db --file=schema/init.sql
-- or paste directly into Cloudflare Dashboard → D1 → SQL Console

PRAGMA foreign_keys = ON;

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK(role IN ('student', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Semesters
CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 3. Courses
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  semester_id TEXT NOT NULL REFERENCES semesters(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lectures
CREATE TABLE IF NOT EXISTS lectures (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id),
  youtube_id TEXT NOT NULL,
  week INTEGER NOT NULL,
  topic TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Resources (PDFs/Slides stored in R2)
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  r2_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 7. Lecture ↔ Tags Junction
CREATE TABLE IF NOT EXISTS lecture_tags (
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  tag_id TEXT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (lecture_id, tag_id)
);

-- 8. Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id TEXT NOT NULL REFERENCES users(id),
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lecture_id)
);

-- 9. Progress Tracking
CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL REFERENCES users(id),
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  status TEXT DEFAULT 'watched',
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lecture_id)
);

-- 10. User Notes
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Ratings (1-5)
CREATE TABLE IF NOT EXISTS ratings (
  user_id TEXT NOT NULL REFERENCES users(id),
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
  PRIMARY KEY (user_id, lecture_id)
);

-- 12. Summaries (AI or Admin-generated)
CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  lecture_id TEXT NOT NULL REFERENCES lectures(id),
  content TEXT NOT NULL,
  author TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- FTS5 SEARCH INDEX (Fast full-text search across lectures)
-- ==========================================================
CREATE VIRTUAL TABLE IF NOT EXISTS lecture_search USING fts5(
  topic,
  week,
  course_title,
  semester_name,
  tags,
  content='lectures',
  content_rowid='rowid'
);

-- Triggers to automatically keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS lectures_ai AFTER INSERT ON lectures
BEGIN
  INSERT INTO lecture_search(rowid, topic, week, course_title, semester_name, tags)
  SELECT
    new.rowid,
    new.topic,
    new.week,
    c.title,
    s.name,
    (SELECT group_concat(t.name, ', ') FROM lecture_tags lt JOIN tags t ON lt.tag_id = t.id WHERE lt.lecture_id = new.id)
  FROM courses c
  JOIN semesters s ON c.semester_id = s.id
  WHERE c.id = new.course_id;
END;

CREATE TRIGGER IF NOT EXISTS lectures_au AFTER UPDATE ON lectures
BEGIN
  UPDATE lecture_search SET
    topic = new.topic,
    week = new.week,
    course_title = (SELECT title FROM courses WHERE id = new.course_id),
    semester_name = (SELECT s.name FROM courses c JOIN semesters s ON c.semester_id = s.id WHERE c.id = new.course_id),
    tags = (SELECT group_concat(t.name, ', ') FROM lecture_tags lt JOIN tags t ON lt.tag_id = t.id WHERE lt.lecture_id = new.id)
  WHERE rowid = new.rowid;
END;

CREATE TRIGGER IF NOT EXISTS lectures_ad AFTER DELETE ON lectures
BEGIN
  DELETE FROM lecture_search WHERE rowid = old.rowid;
END;

-- ==========================================================
-- PERFORMANCE INDEXES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_lectures_course_week ON lectures(course_id, week);
CREATE INDEX IF NOT EXISTS idx_resources_lecture ON resources(lecture_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_lecture ON notes(user_id, lecture_id);
CREATE INDEX IF NOT EXISTS idx_ratings_lecture ON ratings(lecture_id);