"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "@/components/QuestionCard";

interface TestQuestion {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  topic: string;
  difficulty: string;
  format: string;
}

interface TestData {
  testId: string;
  questions: TestQuestion[];
}

export default function TestPage() {
  const router = useRouter();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("currentTest");
    if (!stored) {
      router.push("/");
      return;
    }
    setTestData(JSON.parse(stored));
  }, [router]);

  function handleAnswer(questionId: number, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (!testData) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: testData.testId, answers }),
      });

      if (!res.ok) throw new Error("Submission failed");

      const results = await res.json();
      sessionStorage.setItem("testResults", JSON.stringify(results));
      router.push("/results");
    } catch {
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const period = sessionStorage.getItem("testPeriod") || "";
  const periodLabel =
    period === "last_week"
      ? "Last Week"
      : period === "last_month"
        ? "Last Month"
        : "Last Year";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              MicroMock — {periodLabel}
            </h1>
            <p className="text-sm text-gray-500">
              {answeredCount}/10 questions answered
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${
              answeredCount === 10
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting
              ? "Submitting..."
              : answeredCount === 10
                ? "Submit Test"
                : `Submit (${answeredCount}/10)`}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {testData.questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            questionNumber={idx + 1}
            question={q.question}
            options={q.options}
            selectedAnswer={answers[q.id] || null}
            onSelect={(answer) => handleAnswer(q.id, answer)}
            topic={q.topic}
            difficulty={q.difficulty}
          />
        ))}

        <div className="text-center py-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
          {answeredCount < 10 && (
            <p className="text-sm text-gray-500 mt-2">
              You have answered {answeredCount} of 10 questions. Unanswered
              questions will be marked incorrect.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
