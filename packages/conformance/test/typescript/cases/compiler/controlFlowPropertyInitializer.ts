/*---
description: Ported from TypeScript's tests/cases/compiler/controlFlowPropertyInitializer.ts.
outcome: success
source: tests/cases/compiler/controlFlowPropertyInitializer.ts
---*/
// @target: es2015
// @strictNullChecks: true

// Repro from #8967

const LANG = "Turbo Pascal"

class BestLanguage {
    name = LANG;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
