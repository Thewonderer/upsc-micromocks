"use client";

interface Props {
  questionNumber: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  topic: string;
  difficulty: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

const TOPIC_LABELS: Record<string, string> = {
  polity: "Polity",
  economy: "Economy",
  environment: "Environment",
  history_culture: "History & Culture",
  current_affairs: "Current Affairs",
};

export default function QuestionCard({
  questionNumber,
  question,
  options,
  selectedAnswer,
  onSelect,
  topic,
  difficulty,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-gray-900 text-white text-sm font-bold px-3 py-1 rounded-full">
          Q{questionNumber}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
          {TOPIC_LABELS[topic] || topic}
        </span>
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${DIFFICULTY_COLORS[difficulty] || ""}`}
        >
          {difficulty}
        </span>
      </div>

      <p className="text-gray-900 font-medium mb-5 whitespace-pre-line leading-relaxed">
        {question}
      </p>

      <div className="space-y-3">
        {(["a", "b", "c", "d"] as const).map((key) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedAnswer === key
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="font-semibold text-gray-700 mr-3">
              ({key.toUpperCase()})
            </span>
            <span className="text-gray-800">{options[key]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
