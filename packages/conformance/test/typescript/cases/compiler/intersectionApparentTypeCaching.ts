/*---
description: Ported from TypeScript's tests/cases/compiler/intersectionApparentTypeCaching.ts.
outcome: success
source: tests/cases/compiler/intersectionApparentTypeCaching.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// https://github.com/microsoft/TypeScript/issues/58175

type TX<T extends any[] & object> = T["length"];
type T0<U extends any[] & object> = U;
type T1 = T0<string[]>;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
