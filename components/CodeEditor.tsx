'use client'

import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import * as acorn from 'acorn'
import { lintAST, LintError } from '@/utils/linter'
import { useLinterStore } from '@/store/useLinterStore'
import { EditorView, Decoration, DecorationSet } from '@codemirror/view'
import { Tooltip as ReactTooltip } from 'react-tooltip'

export default function CodeEditor() {
  const [code, setCode] = useState('// Write JavaScript here...')
  const { setErrors } = useLinterStore()
  const [decorations, setDecorations] = useState<DecorationSet>(Decoration.none)

  const handleCodeChange = (value: string) => {
    setCode(value);
    try {
      const ast = acorn.parse(value, { ecmaVersion: 2020, locations: true });
      const lintErrors: LintError[] = lintAST(ast, value);
  
      const uniqueErrors = Array.from(
        new Map(
          lintErrors.map((e) => [`${e.message}:${e.start}:${e.end}`, e])
        ).values()
      );
      setErrors(uniqueErrors.map((error) => error.message));
  
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
  
      console.log(
        'Decorations:',
        highlightDecorations.map((dec) => ({
          from: dec.from,
          to: dec.to,
          class: dec.value.spec.class,
        }))
      );
      setDecorations(Decoration.set(highlightDecorations));
    } catch (error: any) {
      setErrors([`Syntax Error: ${error.message}`]);
      setDecorations(Decoration.none);
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
        className="border rounded-lg"
      />
      {/* New: Render React-Tooltip to display error messages and fixes */}
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
  )
}
