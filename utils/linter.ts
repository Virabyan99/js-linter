import * as astring from 'astring'

export interface LintError {
  message: string
  fix: string
  severity: 'warning' | 'error'
  start: number
  end: number
}

export function lintAndFixAST(ast: any, code: string): { errors: LintError[]; fixedCode: string } {
  const errors: LintError[] = []
  const globalVariables = new Set(['console', 'Math', 'Date', 'setTimeout', 'clearTimeout', 'Set'])
  const scopes: Set<string>[] = [new Set(globalVariables)]
  const variablePositions = new Map<string, { start: number; end: number }>()
  const usedVariables = new Set<string>()

  function enterScope() {
    scopes.push(new Set())
  }

  function exitScope() {
    scopes.pop()
  }

  function declareVariable(name: string, start: number, end: number) {
    scopes[scopes.length - 1].add(name)
    variablePositions.set(name, { start, end })
  }

  function isVariableDeclared(name: string): boolean {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (scopes[i].has(name)) return true
    }
    return false
  }

  function traverse(node: any, parent: any = null) {
    if (!node || typeof node !== 'object') return

    if (node.type === 'FunctionDeclaration' && node.id) {
      declareVariable(node.id.name, node.id.start, node.id.end)
    }

    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression' ||
      node.type === 'BlockStatement'
    ) {
      enterScope()
      if (node.params) {
        node.params.forEach((param: any) => {
          if (param.type === 'Identifier') {
            declareVariable(param.name, param.start, param.end)
          }
        })
      }
    }

    // Rule 1: Missing Semicolon - Auto-Fix
    if (node.type === 'ExpressionStatement' && parent?.type !== 'ForStatement') {
      const codeSnippet = code.substring(node.start, node.end)
      if (!codeSnippet.trim().endsWith(';')) {
        const lastCharPos = node.end - 1
        if (lastCharPos >= 0) {
          errors.push({
            message: 'Missing semicolon.',
            fix: 'Add a semicolon at the end of the statement.',
            severity: 'warning',
            start: lastCharPos,
            end: node.end,
          })
          node.extra = { needsSemicolon: true }
        }
      }
    }

    // Rule 2: Undeclared Variables - No Auto-Fix
    if (
      node.type === 'Identifier' &&
      parent?.type !== 'VariableDeclarator' &&
      !(parent?.type === 'MemberExpression' && parent.property === node) &&
      !(parent?.type === 'Property' && parent.key === node)
    ) {
      if (!isVariableDeclared(node.name)) {
        errors.push({
          message: `Undeclared variable: '${node.name}'`,
          fix: 'Declare this variable using `let`, `const`, or `var`.',
          severity: 'error',
          start: node.start,
          end: node.end,
        })
      } else {
        usedVariables.add(node.name)
      }
    }

    // Rule 3: Variable Declaration
    if (node.type === 'VariableDeclarator') {
      const varName = node.id.name
      declareVariable(varName, node.id.start, node.id.end)
    }

    for (const key in node) {
      if (Array.isArray(node[key])) {
        node[key].forEach((child) => traverse(child, node))
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        traverse(node[key], node)
      }
    }

    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression' ||
      node.type === 'BlockStatement'
    ) {
      exitScope()
    }
  }

  traverse(ast)

  // Report unused variables as errors
  variablePositions.forEach((pos, varName) => {
    if (!usedVariables.has(varName) && !globalVariables.has(varName)) {
      errors.push({
        message: `Unused variable: '${varName}'`,
        fix: 'Remove this variable if it’s not needed.',
        severity: 'warning',
        start: pos.start,
        end: pos.end,
      })
    }
  })

  // Remove unused variable declarations
  function removeUnusedDeclarations(node: any, parent: any) {
    if (node.type === 'VariableDeclaration') {
      node.declarations = node.declarations.filter((decl: any) => usedVariables.has(decl.id.name))
      if (node.declarations.length === 0) {
        return null
      }
    }
    return node
  }

  // Apply fixes (e.g., add semicolons)
  function applyFixes(node: any) {
    if (node.extra?.needsSemicolon) {
      node.source = code.substring(node.start, node.end) + ';'
    }
    return node
  }

  // Transform the AST
  function transformAST(node: any, parent: any = null) {
    node = applyFixes(node)
    node = removeUnusedDeclarations(node, parent)
    for (const key in node) {
      if (Array.isArray(node[key])) {
        node[key] = node[key].map((child: any) => transformAST(child, node)).filter(Boolean)
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        node[key] = transformAST(node[key], node)
      }
    }
    return node
  }

  const transformedAST = transformAST(ast)
  const fixedCode = astring.generate(transformedAST)

  return { errors, fixedCode }
}