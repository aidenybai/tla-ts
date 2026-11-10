/*---
description: Ported from TypeScript's tests/cases/compiler/awaitedTypeCrash.ts.
outcome: success
source: tests/cases/compiler/awaitedTypeCrash.ts
---*/
// @strict: false
// @target: esnext

// https://github.com/microsoft/TypeScript/issues/51984
async function* f<T extends Promise<never>>(): AsyncGenerator<T, void, void> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
