/*---
description: Ported from TypeScript's tests/cases/conformance/types/conditional/inferTypesWithExtendsDependingOnTypeVariables.ts.
outcome: success
source: tests/cases/conformance/types/conditional/inferTypesWithExtendsDependingOnTypeVariables.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// repro from https://github.com/microsoft/TypeScript/issues/54197

type Bar<K, T extends readonly unknown[]> = T extends readonly [any, ...infer X extends readonly K[]] ? X : never;
type Res1 = Bar<"a" | "b", ["a", "b", "b"]>

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
