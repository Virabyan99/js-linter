'use client'

import { useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import * as acorn from 'acorn';
import { lintAndFixAST } from '@/utils/linter';
import { useLinterStore } from '@/store/useLinterStore';
import { useLintingHistoryStore } from '@/store/useLintingHistoryStore';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { debounce } from 'lodash';

export default function CodeEditor({
  code,
  onCodeChange,
}: {
  code: string;
  onCodeChange: (value: string) => void;
}) {
  const { setErrors } = useLinterStore();
  const { saveHistory } = useLintingHistoryStore();
  const [decorations, setDecorations] = useState<DecorationSet>(Decoration.none);
  const editorRef = useRef<EditorView | null>(null);
  const [previousErrors, setPreviousErrors] = useState<string[]>([]);

  // Debounced function to save linting history
  const debouncedSaveHistory = debounce((currentCode: string, currentErrors: string[]) => {
    const currentErrorStr = JSON.stringify(currentErrors);
    const prevErrorStr = JSON.stringify(previousErrors);
    if (currentErrorStr !== prevErrorStr) {
      saveHistory(currentCode, currentErrors);
      setPreviousErrors(currentErrors);
    }
  }, 2000); // 2-second debounce delay

  const handleCodeChange = (value: string) => {
    onCodeChange(value);
    try {
      const ast = acorn.parse(value, { ecmaVersion: 2020, locations: true });
      const { errors } = lintAndFixAST(ast, value);

      const uniqueErrors = Array.from(
        new Map(
          errors.map((e) => [`${e.message}:${e.start}:${e.end}`, e])
        ).values()
      );
      const errorMessages = uniqueErrors.map((error) => error.message);
      setErrors(errorMessages);

      // Trigger debounced save history
      debouncedSaveHistory(value, errorMessages);

      const sortedErrors = uniqueErrors
        .filter(
          (error) =>
            typeof error.start === 'number' &&
            typeof error.end === 'number' &&
            error.start <= error.end &&
            error.start >= 0
        )
        .sort((a, b) => a.start - b.start);

      const highlightDecorations = sortedErrors
        .map((error) => {
          try {
            if (!Number.isFinite(error.start) || !Number.isFinite(error.end) || error.start > error.end) {
              console.warn('Invalid range for error:', error);
              return null;
            }
            let decorationClass = 'cm-error';
            if (error.message.includes('Missing semicolon')) {
              decorationClass = 'cm-missing-semicolon';
            } else if (error.message.includes('Undeclared variable')) {
              decorationClass = 'cm-undeclared-variable';
            } else if (error.message.includes('Unused variable')) {
              decorationClass = 'cm-unused-variable';
            }
            const mark = Decoration.mark({
              class: decorationClass,
              attributes: {
                'data-tooltip-id': 'error-tooltip',
                'data-tooltip-content': `${error.message}<br />Fix: ${error.fix}`,
              },
            });
            return mark.range(error.start, error.end);
          } catch (decError) {
            console.error('Error creating decoration for:', error, decError);
            return null;
          }
        })
        .filter((dec) => dec !== null);

      setDecorations(Decoration.set(highlightDecorations));
    } catch (error: any) {
      setErrors([`Syntax Error: ${error.message}`]);
      setDecorations(Decoration.none);
    }
  };

  const handleFixCode = () => {
    try {
      const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
      const { fixedCode } = lintAndFixAST(ast, code);
      if (editorRef.current) {
        const transaction = editorRef.current.state.update({
          changes: { from: 0, to: editorRef.current.state.doc.length, insert: fixedCode },
        });
        editorRef.current.dispatch(transaction);
      }
      onCodeChange(fixedCode);
    } catch (error: any) {
      setErrors([`Fixing Error: ${error.message}`]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-4 border rounded-lg bg-white shadow">
      <h2 className="text-xl font-semibold mb-2">JavaScript Editor</h2>
      <CodeMirror
        value={code}
        height="300px"
        extensions={[
          javascript(),
          EditorView.decorations.of(() => decorations),
        ]}
        onChange={handleCodeChange}
        onCreateEditor={(view) => {
          editorRef.current = view;
        }}
        className="border rounded-lg"
      />
      <button
        onClick={handleFixCode}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Fix Issues
      </button>
      <ReactTooltip
        id="error-tooltip"
        place="top"
        variant="dark"
        float={false}
        render={({ content }) => (
          <div dangerouslySetInnerHTML={{ __html: content || '' }} />
        )}
      />
    </div>
  );
}