export type TimePeriod = "last_week" | "last_month" | "last_year";

export type Topic =
  | "polity"
  | "economy"
  | "environment"
  | "history_culture"
  | "current_affairs";

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionFormat =
  | "statement_based"
  | "direct_mcq"
  | "match_pair"
  | "assertion_reason";

export interface Question {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correct_answer: "a" | "b" | "c" | "d";
  explanation: string;
  topic: Topic;
  difficulty: Difficulty;
  format: QuestionFormat;
  source_article: string;
  upsc_concept_link: string;
}

export interface Test {
  id: string;
  period: TimePeriod;
  questions: Question[];
  created_at: string;
  expires_at: string;
}

export interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category?: string;
}

export interface TestResponse {
  testId: string;
  questions: Omit<Question, "correct_answer" | "explanation">[];
}

export interface SubmitRequest {
  testId: string;
  answers: Record<number, string>;
}

export interface QuestionResult extends Question {
  user_answer: string;
  is_correct: boolean;
}

export interface SubmitResponse {
  score: number;
  total: number;
  results: QuestionResult[];
}
