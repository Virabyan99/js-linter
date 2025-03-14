export interface LintError {
    message: string;
    start: number;
    end: number;
  }
  
  export function lintAST(ast: any, code: string): LintError[] {
    const errors: LintError[] = [];
    const globalVariables = new Set(['console', 'Math', 'Date', 'setTimeout', 'clearTimeout', 'Set']);
    const scopes: Set<string>[] = [new Set(globalVariables)];
    const variablePositions = new Map<string, { start: number; end: number }>();
  
    function enterScope() {
      scopes.push(new Set());
    }
  
    function exitScope() {
      scopes.pop();
    }
  
    function declareVariable(name: string, start: number, end: number) {
      scopes[scopes.length - 1].add(name);
      variablePositions.set(name, { start, end });
    }
  
    function isVariableDeclared(name: string): boolean {
      for (let i = scopes.length - 1; i >= 0; i--) {
        if (scopes[i].has(name)) return true;
      }
      return false;
    }
  
    function traverse(node: any, parent: any = null) {
      if (!node || typeof node !== 'object') return;
  
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'BlockStatement'
      ) {
        enterScope();
        if (node.params) {
          node.params.forEach((param: any) => {
            if (param.type === 'Identifier') {
              declareVariable(param.name, param.start, param.end);
            }
          });
        }
      }
  
      if (node.type === 'ExpressionStatement' && parent?.type !== 'ForStatement') {
        const codeSnippet = code.substring(node.start, node.end);
        if (!codeSnippet.trim().endsWith(';')) {
          const lastCharPos = node.end - 1;
          if (lastCharPos >= 0) {
            errors.push({
              message: 'Missing semicolon.',
              start: lastCharPos,
              end: node.end,
            });
          }
        }
      }
  
      if (
        node.type === 'Identifier' &&
        parent?.type !== 'VariableDeclarator' &&
        !(parent?.type === 'MemberExpression' && parent.property === node) &&
        !(parent?.type === 'Property' && parent.key === node)
      ) {
        if (!isVariableDeclared(node.name)) {
          errors.push({
            message: `Undeclared variable: '${node.name}'`,
            start: node.start,
            end: node.end,
          });
        }
      }
  
      if (node.type === 'VariableDeclarator') {
        const varName = node.id.name;
        declareVariable(varName, node.id.start, node.id.end);
      }
  
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child) => traverse(child, node));
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          traverse(node[key], node);
        }
      }
  
      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'BlockStatement'
      ) {
        exitScope();
      }
    }
  
    traverse(ast);
  
    const usedVariables = new Set<string>();
    function collectUsedVariables(node: any, parent: any = null) {
      if (!node || typeof node !== 'object') return;
      if (
        node.type === 'Identifier' &&
        parent &&
        !['VariableDeclarator', 'FunctionDeclaration'].includes(parent.type)
      ) {
        usedVariables.add(node.name);
      }
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child) => collectUsedVariables(child, node));
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          collectUsedVariables(node[key], node);
        }
      }
    }
    collectUsedVariables(ast, null);
  
    variablePositions.forEach((pos, varName) => {
      if (!usedVariables.has(varName) && !globalVariables.has(varName)) {
        errors.push({
          message: `Unused variable: '${varName}'`,
          start: pos.start,
          end: pos.end,
        });
      }
    });
  
    return errors;
  }