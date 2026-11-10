/*---
description: Ported from TypeScript's tests/cases/compiler/abstractInterfaceIdentifierName.ts.
outcome: success
source: tests/cases/compiler/abstractInterfaceIdentifierName.ts
---*/
// @target: es2015

interface abstract {
    abstract(): void;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
