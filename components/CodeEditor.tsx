"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import * as acorn from "acorn";
import { lintAST } from "@/utils/linter";
import { useLinterStore } from "@/store/useLinterStore";

export default function CodeEditor() {
  const [code, setCode] = useState("// Write JavaScript here...");
  const { setErrors } = useLinterStore();

  const handleCodeChange = (value: string) => {
    setCode(value);
    try {
      // Parse JavaScript into AST
      const ast = acorn.parse(value, { ecmaVersion: 2020 });

      // Apply linting rules
      const lintErrors = lintAST(ast);
      setErrors(lintErrors);
    } catch (error: any) {
      setErrors([`Syntax Error: ${error.message}`]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-4 border rounded-lg bg-white shadow">
      <h2 className="text-xl font-semibold mb-2">JavaScript Editor</h2>
      <CodeMirror
        value={code}
        height="300px"
        extensions={[javascript()]}
        onChange={handleCodeChange}
        className="border rounded-lg"
      />
    </div>
  );
}
