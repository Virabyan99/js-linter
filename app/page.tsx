"use client";
import CodeEditor from "@/components/CodeEditor";
import LinterOutput from "@/components/LinterOutput";
import LintingHistory from "@/components/LintingHistory";
import { useState } from 'react';

export default function Home() {
  // Define the code state with an initial value
  const [code, setCode] = useState('// Write JavaScript here...');

  // Function to handle restoring code from LintingHistory
  const handleRestore = (restoredCode: string) => {
    setCode(restoredCode);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">JavaScript Code Linter</h1>
      {/* Pass code and onCodeChange to CodeEditor */}
      <CodeEditor code={code} onCodeChange={setCode} />
      <LinterOutput />
      {/* Pass handleRestore to LintingHistory */}
      <LintingHistory onRestore={handleRestore} />
    </main>
  );
}