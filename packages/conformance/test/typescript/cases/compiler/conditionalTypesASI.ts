/*---
description: Ported from TypeScript's tests/cases/compiler/conditionalTypesASI.ts.
outcome: success
source: tests/cases/compiler/conditionalTypesASI.ts
---*/
// @target: es2015
// @declaration: true

// Repro from #21637

interface JSONSchema4 {
  a?: number
  extends?: string | string[]
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
