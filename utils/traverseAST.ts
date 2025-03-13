export function traverseAST(node: any, depth = 0) {
    if (!node || typeof node !== "object") return;
  
    // Indentation for readability
    const indent = "  ".repeat(depth);
    console.log(`${indent}- ${node.type}`);
  
    // Special logging for variable declarations
    if (node.type === "VariableDeclarator") {
      console.log(`${indent}  Identifier: ${node.id.name}`);
    }
  
    // Special logging for function declarations
    if (node.type === "FunctionDeclaration") {
      console.log(`${indent}  Function Name: ${node.id.name}`);
    }
  
    // Recursively traverse child nodes
    for (const key in node) {
      if (Array.isArray(node[key])) {
        node[key].forEach((child) => traverseAST(child, depth + 1));
      } else if (typeof node[key] === "object" && node[key] !== null) {
        traverseAST(node[key], depth + 1);
      }
    }
  }
  