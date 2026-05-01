"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ResultCard from "@/components/ResultCard";
import { type SubmitResponse } from "@/lib/types";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("testResults");
    if (!stored) {
      router.push("/");
      return;
    }
    setResults(JSON.parse(stored));
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const percentage = Math.round((results.score / results.total) * 100);
  const scoreColor =
    percentage >= 60
      ? "text-green-600"
      : percentage >= 40
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Test Results
          </h1>
          <div className={`text-6xl font-bold ${scoreColor} mb-2`}>
            {results.score}/{results.total}
          </div>
          <p className="text-gray-600 mb-6">{percentage}% correct</p>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-700">
                {results.results.filter((r) => r.is_correct).length}
              </div>
              <div className="text-xs text-green-600">Correct</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-xl font-bold text-red-700">
                {results.results.filter((r) => !r.is_correct).length}
              </div>
              <div className="text-xs text-red-600">Incorrect</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xl font-bold text-gray-700">
                {results.results.filter((r) => !r.user_answer).length}
              </div>
              <div className="text-xs text-gray-600">Unanswered</div>
            </div>
          </div>

          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
          >
            Take Another Test
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Detailed Review
        </h2>

        {results.results.map((result, idx) => (
          <ResultCard key={result.id} result={result} questionNumber={idx + 1} />
        ))}

        <div className="text-center py-8">
          <button
            onClick={() => {
              sessionStorage.clear();
              router.push("/");
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
          >
            Take Another Test
          </button>
        </div>
      </div>
    </main>
  );
}
