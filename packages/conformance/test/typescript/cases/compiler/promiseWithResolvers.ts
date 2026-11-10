/*---
description: Ported from TypeScript's tests/cases/compiler/promiseWithResolvers.ts.
outcome: success
source: tests/cases/compiler/promiseWithResolvers.ts
---*/
// @target: esnext

type T = {};
const { promise, resolve, reject } = Promise.withResolvers<T>();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
