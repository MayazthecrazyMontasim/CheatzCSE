export async function searchLectures(db: D1Database, query: string) {
  // FTS5-compatible query
  const sanitized = query.replace(/["']/g, '').trim();
  if (!sanitized) return { results: [] };
  
  return db.prepare(`
    SELECT l.*, c.title as course_title, s.name as semester_name,
           group_concat(t.name, ', ') as tags
    FROM lecture_search ls
    JOIN lectures l ON ls.rowid = l.rowid
    JOIN courses c ON l.course_id = c.id
    JOIN semesters s ON c.semester_id = s.id
    LEFT JOIN lecture_tags lt ON l.id = lt.lecture_id
    LEFT JOIN tags t ON lt.tag_id = t.id
    WHERE ls MATCH ?
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `).bind(sanitized).all();
}