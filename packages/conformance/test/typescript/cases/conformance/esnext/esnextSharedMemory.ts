/*---
description: Ported from TypeScript's tests/cases/conformance/esnext/esnextSharedMemory.ts.
outcome: success
source: tests/cases/conformance/esnext/esnextSharedMemory.ts
---*/
// @target: es2015
// @lib: esnext

Atomics.pause();
Atomics.pause(1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
