/*---
description: Ported from TypeScript's tests/cases/compiler/nestedHomomorphicMappedTypesWithArrayConstraint1.ts.
outcome: success
source: tests/cases/compiler/nestedHomomorphicMappedTypesWithArrayConstraint1.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

// Based on @types/sinon v10

type MatchArguments<T> = {
    [K in keyof T]: T[K];
};

interface SinonSpyCallApi<TArgs extends any[] = any[]> {
    calledWith(...args: Partial<MatchArguments<TArgs>>): boolean;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
