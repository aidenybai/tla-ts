import ts from "@typescript/typescript6";
import { isModuleFile } from "./context";

// Whether Node runs a TypeScript file as an ES module: by its extension or package.json, or as
// its syntax needs one.
export const isEsModule = (sourceFile: ts.SourceFile) =>
  ts.getImpliedNodeFormatForFile(sourceFile.fileName, undefined, ts.sys, {
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }) === ts.ModuleKind.ESNext || isModuleFile(sourceFile);
