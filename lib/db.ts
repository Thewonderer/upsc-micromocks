import Database from "better-sqlite3";
import path from "path";
import { subDays } from "date-fns";
import { type Question, type TimePeriod } from "./types";

// Questions CASCADE through pools based on their age:
//
// "Last Week" pool: questions originally about this week's news (period=last_week, <7 days old)
// "Last Month" pool: questions about this month's news (period=last_month, <30 days old)
//                    + last_week questions that are now 8-30 days old (they cascaded down)
// "Last Year" pool: questions about this year's news (period=last_year)
//                   + last_month questions that are now 31+ days old
//                   + last_week questions that are now 31+ days old

type QuestionRow = {
  id: number;
  question: string;
  options_json: string;
  correct_answer: string;
  explanation: string;
  topic: string;
  difficulty: string;
  format: string;
  source_article: string;
  upsc_concept_link: string;
};

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "data", "cache.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      format TEXT NOT NULL,
      source_article TEXT NOT NULL,
      upsc_concept_link TEXT NOT NULL,
      original_period TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at);
    CREATE INDEX IF NOT EXISTS idx_questions_period ON questions(original_period);
    CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
    CREATE INDEX IF NOT EXISTS idx_questions_batch ON questions(batch_id);

    CREATE TABLE IF NOT EXISTS test_sessions (
      id TEXT PRIMARY KEY,
      question_ids TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS guest_usage (
      ip TEXT PRIMARY KEY,
      tests_taken INTEGER NOT NULL DEFAULT 0,
      last_test_at TEXT NOT NULL
    );
  `);

  return db;
}

export function insertQuestions(
  questions: Array<Question & { original_period: TimePeriod }>,
  batchId: string
): void {
  const database = getDb();
  const now = new Date().toISOString();
  const stmt = database.prepare(
    `INSERT INTO questions (question, options_json, correct_answer, explanation, topic, difficulty, format, source_article, upsc_concept_link, original_period, batch_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = database.transaction((items: typeof questions) => {
    for (const q of items) {
      stmt.run(
        q.question,
        JSON.stringify(q.options),
        q.correct_answer,
        q.explanation,
        q.topic,
        q.difficulty,
        q.format,
        q.source_article,
        q.upsc_concept_link,
        q.original_period,
        batchId,
        now
      );
    }
  });

  insertMany(questions);
}

/**
 * CASCADE LOGIC:
 *
 * User selects "Last Week":
 *   → Serve questions where original_period = 'last_week' AND created_at is within last 7 days
 *
 * User selects "Last Month":
 *   → Serve questions where original_period = 'last_month' AND created_at is within last 30 days
 *   → PLUS: last_week questions where created_at is 8-30 days old (cascaded)
 *
 * User selects "Last Year":
 *   → Serve questions where original_period = 'last_year'
 *   → PLUS: last_month questions where created_at is 31+ days old (cascaded)
 *   → PLUS: last_week questions where created_at is 31+ days old (cascaded)
 */
function buildPoolQuery(period: TimePeriod): { sql: string; params: string[] } {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();

  switch (period) {
    case "last_week":
      // Only fresh last_week questions (less than 7 days old)
      return {
        sql: `original_period = 'last_week' AND created_at >= ?`,
        params: [sevenDaysAgo],
      };

    case "last_month":
      // last_month questions still within 30 days
      // + last_week questions that are now 8-30 days old (cascaded)
      return {
        sql: `(
          (original_period = 'last_month' AND created_at >= ?)
          OR
          (original_period = 'last_week' AND created_at < ? AND created_at >= ?)
        )`,
        params: [thirtyDaysAgo, sevenDaysAgo, thirtyDaysAgo],
      };

    case "last_year":
      // last_year questions (any age within a year)
      // + last_month questions older than 30 days
      // + last_week questions older than 30 days
      return {
        sql: `(
          (original_period = 'last_year')
          OR
          (original_period = 'last_month' AND created_at < ?)
          OR
          (original_period = 'last_week' AND created_at < ?)
        )`,
        params: [thirtyDaysAgo, thirtyDaysAgo],
      };
  }
}

export function getBalancedQuestions(period: TimePeriod): Question[] {
  const database = getDb();
  const { sql: poolFilter, params: poolParams } = buildPoolQuery(period);
  const topics = ["polity", "economy", "environment", "history_culture", "current_affairs"];
  const selected: Question[] = [];

  for (const topic of topics) {
    const rows = database
      .prepare(
        `SELECT * FROM questions WHERE topic = ? AND ${poolFilter} ORDER BY RANDOM() LIMIT 2`
      )
      .all(topic, ...poolParams) as QuestionRow[];

    selected.push(...rows.map(rowToQuestion));
  }

  // Fill remaining slots from the same pool regardless of topic
  if (selected.length < 10) {
    const existingIds = selected.map((q) => q.id);
    const placeholders = existingIds.length > 0 ? existingIds.map(() => "?").join(",") : "0";
    const filler = database
      .prepare(
        `SELECT * FROM questions WHERE id NOT IN (${placeholders}) AND ${poolFilter} ORDER BY RANDOM() LIMIT ?`
      )
      .all(...existingIds, ...poolParams, 10 - selected.length) as QuestionRow[];
    selected.push(...filler.map(rowToQuestion));
  }

  // Last resort fallback: if the pool is too small, pull anything
  if (selected.length < 10) {
    const existingIds = selected.map((q) => q.id);
    const placeholders = existingIds.length > 0 ? existingIds.map(() => "?").join(",") : "0";
    const filler = database
      .prepare(
        `SELECT * FROM questions WHERE id NOT IN (${placeholders}) ORDER BY created_at DESC LIMIT ?`
      )
      .all(...existingIds, 10 - selected.length) as QuestionRow[];
    selected.push(...filler.map(rowToQuestion));
  }

  return selected.slice(0, 10);
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    question: row.question,
    options: JSON.parse(row.options_json),
    correct_answer: row.correct_answer as "a" | "b" | "c" | "d",
    explanation: row.explanation,
    topic: row.topic as Question["topic"],
    difficulty: row.difficulty as Question["difficulty"],
    format: row.format as Question["format"],
    source_article: row.source_article,
    upsc_concept_link: row.upsc_concept_link,
  };
}

export function saveTestSession(
  testId: string,
  questionIds: number[]
): void {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO test_sessions (id, question_ids, created_at) VALUES (?, ?, ?)`
    )
    .run(testId, JSON.stringify(questionIds), new Date().toISOString());
}

export function getTestSession(
  testId: string
): { questionIds: number[] } | null {
  const database = getDb();
  const row = database
    .prepare(`SELECT * FROM test_sessions WHERE id = ?`)
    .get(testId) as { question_ids: string } | undefined;

  if (!row) return null;
  return { questionIds: JSON.parse(row.question_ids) };
}

export function getQuestionsById(ids: number[]): Question[] {
  if (ids.length === 0) return [];
  const database = getDb();
  const placeholders = ids.map(() => "?").join(",");
  const rows = database
    .prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`)
    .all(...ids) as QuestionRow[];

  return rows.map(rowToQuestion);
}

export function getQuestionCount(period?: TimePeriod): number {
  const database = getDb();
  if (period) {
    const { sql: poolFilter, params: poolParams } = buildPoolQuery(period);
    const row = database
      .prepare(`SELECT COUNT(*) as count FROM questions WHERE ${poolFilter}`)
      .get(...poolParams) as { count: number };
    return row.count;
  }
  const row = database
    .prepare(`SELECT COUNT(*) as count FROM questions`)
    .get() as { count: number };
  return row.count;
}

export function checkGuestUsage(ip: string): number {
  const database = getDb();
  const row = database
    .prepare(`SELECT tests_taken FROM guest_usage WHERE ip = ?`)
    .get(ip) as { tests_taken: number } | undefined;
  return row?.tests_taken || 0;
}

export function recordGuestUsage(ip: string): void {
  const database = getDb();
  database
    .prepare(
      `INSERT INTO guest_usage (ip, tests_taken, last_test_at) VALUES (?, 1, ?)
       ON CONFLICT(ip) DO UPDATE SET tests_taken = tests_taken + 1, last_test_at = ?`
    )
    .run(ip, new Date().toISOString(), new Date().toISOString());
}
