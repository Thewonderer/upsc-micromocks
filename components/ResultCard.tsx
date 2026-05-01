"use client";

import { type QuestionResult } from "@/lib/types";

interface Props {
  result: QuestionResult;
  questionNumber: number;
}

const TOPIC_LABELS: Record<string, string> = {
  polity: "Polity",
  economy: "Economy",
  environment: "Environment",
  history_culture: "History & Culture",
  current_affairs: "Current Affairs",
};

export default function ResultCard({ result, questionNumber }: Props) {
  return (
    <div
      className={`rounded-xl border-2 p-6 mb-6 ${
        result.is_correct
          ? "border-green-300 bg-green-50"
          : "border-red-300 bg-red-50"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="bg-gray-900 text-white text-sm font-bold px-3 py-1 rounded-full">
            Q{questionNumber}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
            {TOPIC_LABELS[result.topic] || result.topic}
          </span>
          <span
            className={`text-sm font-bold ${result.is_correct ? "text-green-700" : "text-red-700"}`}
          >
            {result.is_correct ? "Correct" : "Incorrect"}
          </span>
        </div>
      </div>

      <p className="text-gray-900 font-medium mb-4 whitespace-pre-line leading-relaxed">
        {result.question}
      </p>

      <div className="space-y-2 mb-5">
        {(["a", "b", "c", "d"] as const).map((key) => {
          let borderClass = "border-gray-200";
          if (key === result.correct_answer) borderClass = "border-green-500 bg-green-100";
          else if (key === result.user_answer && !result.is_correct)
            borderClass = "border-red-400 bg-red-100";

          return (
            <div
              key={key}
              className={`p-3 rounded-lg border-2 ${borderClass}`}
            >
              <span className="font-semibold text-gray-700 mr-3">
                ({key.toUpperCase()})
              </span>
              <span className="text-gray-800">{result.options[key]}</span>
              {key === result.correct_answer && (
                <span className="ml-2 text-green-700 font-bold text-sm">
                  ← Correct
                </span>
              )}
              {key === result.user_answer && key !== result.correct_answer && (
                <span className="ml-2 text-red-700 font-bold text-sm">
                  ← Your answer
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-bold text-gray-900 mb-2">Explanation</h4>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {result.explanation}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            UPSC Concept: {result.upsc_concept_link}
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            Source: {result.source_article}
          </span>
        </div>
      </div>
    </div>
  );
}
