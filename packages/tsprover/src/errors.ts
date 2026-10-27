import { relative } from "node:path";
import type ts from "typescript";

const getLocation = (node: ts.Node) => {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return `${relative(process.cwd(), sourceFile.fileName)}:${position.line + 1}:${position.character + 1}`;
};

export class TsproverError extends Error {
  constructor(message: string, node?: ts.Node) {
    super(node === undefined ? message : `${getLocation(node)} ${message}`);
    this.name = "TsproverError";
  }
}
