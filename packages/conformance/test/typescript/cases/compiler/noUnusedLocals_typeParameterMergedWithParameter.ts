/*---
description: Ported from TypeScript's tests/cases/compiler/noUnusedLocals_typeParameterMergedWithParameter.ts.
outcome: success
source: tests/cases/compiler/noUnusedLocals_typeParameterMergedWithParameter.ts
---*/
// @target: es2015
// @noUnusedLocals: true
// @noUnusedParameters: true

function useNone<T>(T: number) {}

function useParam<T>(T: number) {
    return T;
}

function useTypeParam<T>(T: T) {}

function useBoth<T>(T: T) {
    return T;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
