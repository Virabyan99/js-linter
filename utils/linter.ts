export function lintAST(ast: any) {
    const errors: string[] = [];
    const declaredVariables = new Set<string>();
    const usedVariables = new Set<string>();
    const globalVariables = new Set(['console', 'Math', 'Date', 'setTimeout', 'clearTimeout']);
  
    function traverse(node: any, parent: any = null) {
      if (!node || typeof node !== "object") return;
  
      // Rule 1: Detect Missing Semicolons
      if (node.type === "ExpressionStatement" && parent?.type !== "ForStatement") {
        if (!parent || !("body" in parent) || !Array.isArray(parent.body)) {
          errors.push("Missing semicolon at the end of a statement.");
        }
      }
  
      // Rule 2: Detect Undeclared Variables
      if (
        node.type === "Identifier" &&
        parent?.type !== "VariableDeclarator" &&
        !(parent?.type === "MemberExpression" && parent.property === node)
      ) {
        if (!declaredVariables.has(node.name) && !globalVariables.has(node.name)) {
          errors.push(`Undeclared variable: '${node.name}'`);
        }
        usedVariables.add(node.name);
      }
  
      // Rule 3: Detect Unused Variables
      if (node.type === "VariableDeclarator") {
        declaredVariables.add(node.id.name);
      }
  
      // Recursively traverse child nodes
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach((child) => traverse(child, node));
        } else if (typeof node[key] === "object" && node[key] !== null) {
          traverse(node[key], node);
        }
      }
    }
  
    traverse(ast);
  
    // Final check for unused variables
    declaredVariables.forEach((variable) => {
      if (!usedVariables.has(variable)) {
        errors.push(`Unused variable: '${variable}'`);
      }
    });
  
    return errors;
  }