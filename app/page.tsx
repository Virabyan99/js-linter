import CodeEditor from "@/components/CodeEditor";
import LinterOutput from "@/components/LinterOutput";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">JavaScript Code Linter</h1>
      <CodeEditor />
      <LinterOutput />
    </main>
  );
}
