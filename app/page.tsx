"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TimePeriodSelector from "@/components/TimePeriodSelector";
import { type TimePeriod } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState<TimePeriod | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(period: TimePeriod) {
    setLoading(true);
    setLoadingPeriod(period);
    setError(null);

    try {
      const res = await fetch("/api/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "free_limit_reached") {
          setError("You've used your free test! Sign up to unlock more tests.");
          return;
        }
        if (data.error === "no_questions") {
          setError("Question bank is being prepared. Please check back in a few minutes.");
          return;
        }
        throw new Error(data.message || data.error || "Failed to generate test");
      }

      const data = await res.json();
      sessionStorage.setItem("currentTest", JSON.stringify(data));
      sessionStorage.setItem("testPeriod", period);
      router.push("/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingPeriod(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            UPSC Prelims MicroMocks
          </h1>
          <p className="text-sm font-medium text-blue-600 mb-4">
            Current affairs focused — 10-question mini tests from real news
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Current events mapped to static UPSC concepts. Equally distributed
            across all five subjects. Pick a period to start.
          </p>
        </div>

        <TimePeriodSelector
          onSelect={handleSelect}
          loading={loading}
          loadingPeriod={loadingPeriod}
        />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm font-bold text-gray-900">Polity</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm font-bold text-gray-900">Economy</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm font-bold text-gray-900">Environment</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm font-bold text-gray-900">History &amp; Culture</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-sm font-bold text-gray-900">Science/Tech/IR</div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-2">
          2 questions from each area per micro-mock — balanced coverage every time
        </p>

        <div className="mt-12 bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">How it works</h2>
          <ol className="text-sm text-gray-600 space-y-2">
            <li>
              1. Pick a time period — questions are drawn from current affairs of that window
            </li>
            <li>
              2. Question format mirrors real UPSC Prelims — statement-based,
              match-the-pair, assertion-reason (based on 10 years of PYQs)
            </li>
            <li>
              3. After submission, get detailed explanations with elimination
              strategies for every option
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
