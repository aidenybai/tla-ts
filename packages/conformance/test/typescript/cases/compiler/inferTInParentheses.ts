/*---
description: Ported from TypeScript's tests/cases/compiler/inferTInParentheses.ts.
outcome: success
source: tests/cases/compiler/inferTInParentheses.ts
---*/
// @target: es2015
type F1 = (num: [number]) => void;
type IsNumber<T extends number> = T;

type T1 = F1 extends (...args: (infer T)) => void ? T : never;
type T2 = F1 extends (args: [...(infer T)]) => void ? T : never;
type T3<T> = T extends IsNumber<(infer N)> ? true : false;

type T4 = F1 extends (...args: ((infer T))) => void ? T : never;
type T5 = F1 extends (args: [...((infer T))]) => void ? T : never;
type T6<T> = T extends IsNumber<((infer N))> ? true : false;

type T7 = F1 extends (...args: ((((infer T))))) => void ? T : never;
type T8 = F1 extends (args: [...((((infer T))))]) => void ? T : never;
type T9<T> = T extends IsNumber<((((infer N))))> ? true : false;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
