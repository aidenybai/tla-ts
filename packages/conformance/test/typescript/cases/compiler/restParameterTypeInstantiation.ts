/*---
description: Ported from TypeScript's tests/cases/compiler/restParameterTypeInstantiation.ts.
outcome: success
source: tests/cases/compiler/restParameterTypeInstantiation.ts
---*/
// @target: es2015
// @strict: true

// Repro from #33823

interface TestGeneric<TG> {
  f: string
  g: TG
}

const removeF = <TX>({ f, ...rest }: TestGeneric<TX>) => {
  return rest
}

const result: number = removeF<number>({ f: '', g: 3 }).g

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
