/*---
description: Ported from TypeScript's tests/cases/compiler/dynamicImportTrailingComma.ts.
outcome: throws
source: tests/cases/compiler/dynamicImportTrailingComma.ts
---*/
// @target: es2015
// @module: commonjs
// @skipLibCheck: true
// @lib: es6
const path = './foo';
import(path,);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
