import ts from "@typescript/typescript6";
import { isModuleFile } from "./context";

// Whether Node runs a TypeScript file as an ES module: by its extension or package.json, or as
// its syntax needs one.
export const isEsModule = (sourceFile: ts.SourceFile) =>
  ts.getImpliedNodeFormatForFile(sourceFile.fileName, undefined, ts.sys, {
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }) === ts.ModuleKind.ESNext || isModuleFile(sourceFile);

// Where Node says a script failed: the file's real path, or its URL in an ES module, and the line,
// then the line with a caret under the node.
export const getNodeLocation = (node: ts.Node, isUrl: boolean) => {
  const sourceFile = node.getSourceFile();
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const lineStarts = sourceFile.getLineStarts();
  const line = sourceFile.text
    .slice(lineStarts[start.line], lineStarts[start.line + 1])
    .replace(/\r?\n$/, "");
  const path = ts.sys.realpath?.(ts.sys.resolvePath(sourceFile.fileName)) ?? sourceFile.fileName;
  return `${isUrl ? process.getBuiltinModule("node:url").pathToFileURL(path).href : path}:${start.line + 1}\n${line}\n${" ".repeat(start.character)}^`;
};
