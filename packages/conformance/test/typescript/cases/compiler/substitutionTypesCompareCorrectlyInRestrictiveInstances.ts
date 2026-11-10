/*---
description: Ported from TypeScript's tests/cases/compiler/substitutionTypesCompareCorrectlyInRestrictiveInstances.ts.
outcome: success
source: tests/cases/compiler/substitutionTypesCompareCorrectlyInRestrictiveInstances.ts
---*/
// @target: es2015
// @strict: true
type UnionKeys<T> = T extends any ? keyof T : never;
type BugHelper<T, TAll> = T extends any ? Exclude<UnionKeys<TAll>, keyof T> : never
type Bug<TAll> =  BugHelper<TAll, TAll>
type Q = UnionKeys<{ a : any } | { b: any }>    // should be "a" | "b"
type R = Bug<{ a : any } | { b: any }>          // should be "a" | "b"

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
