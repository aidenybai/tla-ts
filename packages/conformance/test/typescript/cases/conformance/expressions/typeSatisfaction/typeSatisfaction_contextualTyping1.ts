/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_contextualTyping1.ts.
outcome: success
source: tests/cases/conformance/expressions/typeSatisfaction/typeSatisfaction_contextualTyping1.ts
---*/
// @target: es2015
type Predicates = { [s: string]: (n: number) => boolean };

const p = {
    isEven: n => n % 2 === 0,
    isOdd: n => n % 2 === 1
} satisfies Predicates;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
