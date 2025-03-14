"use client";
import CodeEditor from "@/components/CodeEditor";
import LinterOutput from "@/components/LinterOutput";
import LintingHistory from "@/components/LintingHistory";
import LinterSettings from "@/components/LinterSettings";
import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("// Write JavaScript here...");

  const handleRestore = (restoredCode: string) => {
    setCode(restoredCode);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">JavaScript Code Linter</h1>
      <CodeEditor code={code} onCodeChange={setCode} />
      <LinterOutput />
      <LinterSettings />
      <LintingHistory onRestore={handleRestore} />
    </main>
  );
}