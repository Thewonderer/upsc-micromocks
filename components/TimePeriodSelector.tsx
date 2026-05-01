"use client";

import { type TimePeriod } from "@/lib/types";

interface Props {
  onSelect: (period: TimePeriod) => void;
  loading: boolean;
  loadingPeriod: TimePeriod | null;
}

const PERIODS: { value: TimePeriod; label: string; description: string }[] = [
  {
    value: "last_week",
    label: "Last Week",
    description:
      "Questions based on current affairs from the past 7 days. Fresh and topical.",
  },
  {
    value: "last_month",
    label: "Last Month",
    description:
      "Questions covering the past 30 days. Broader range of topics and events.",
  },
  {
    value: "last_year",
    label: "Last Year",
    description:
      "Questions from the past 12 months. Comprehensive coverage of major events.",
  },
];

export default function TimePeriodSelector({
  onSelect,
  loading,
  loadingPeriod,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          onClick={() => onSelect(period.value)}
          disabled={loading}
          className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
            loading && loadingPeriod === period.value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-400 hover:shadow-lg"
          } ${loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {period.label}
          </h3>
          <p className="text-gray-600 text-sm">{period.description}</p>
          {loading && loadingPeriod === period.value && (
            <div className="mt-4 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-600 text-sm">
                Generating your test...
              </span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
