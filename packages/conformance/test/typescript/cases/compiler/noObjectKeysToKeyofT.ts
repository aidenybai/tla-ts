/*---
description: Ported from TypeScript's tests/cases/compiler/noObjectKeysToKeyofT.ts.
outcome: success
source: tests/cases/compiler/noObjectKeysToKeyofT.ts
---*/
// @target: es2016

// Do not change Object.keys to return keyof T.
// The current return type (string[]) is intentional.
Object.keys({ a: 0 }).push("b");

// See also
// https://stackoverflow.com/questions/55012174/why-doesnt-object-keys-return-a-keyof-type-in-typescript

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
