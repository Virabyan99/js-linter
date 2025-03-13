"use client";

import { useLinterStore } from "@/store/useLinterStore";

export default function LinterOutput() {
  const { errors } = useLinterStore();

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-4 border rounded-lg bg-gray-100 shadow">
      <h2 className="text-lg font-semibold">Linter Output</h2>
      {errors.length > 0 ? (
        <ul className="text-red-600 list-disc ml-4">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      ) : (
        <p className="text-green-600">No linting issues found!</p>
      )}
    </div>
  );
}
