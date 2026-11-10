/*---
description: Ported from TypeScript's tests/cases/compiler/objectLiteralDeclarationGeneration1.ts.
outcome: success
source: tests/cases/compiler/objectLiteralDeclarationGeneration1.ts
---*/
// @target: es2015
// @declaration: true
class y<T extends {}>{ }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
