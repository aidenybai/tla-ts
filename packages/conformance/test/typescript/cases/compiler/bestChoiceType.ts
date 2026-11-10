/*---
description: Ported from TypeScript's tests/cases/compiler/bestChoiceType.ts.
outcome: success
source: tests/cases/compiler/bestChoiceType.ts
---*/
// @target: es2015
// @strictNullChecks: true

// Repro from #10041

(''.match(/ /) || []).map(s => s.toLowerCase());

// Similar cases

function f1() {
    let x = ''.match(/ /);
    let y = x || [];
    let z = y.map(s => s.toLowerCase());
}

function f2() {
    let x = ''.match(/ /);
    let y = x ? x : [];
    let z = y.map(s => s.toLowerCase());
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
