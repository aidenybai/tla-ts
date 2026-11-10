/*---
description: Ported from TypeScript's tests/cases/conformance/controlFlow/switchWithConstrainedTypeVariable.ts.
outcome: success
source: tests/cases/conformance/controlFlow/switchWithConstrainedTypeVariable.ts
---*/
// @target: es2015
// @strict: true

// Repro from #20840

function function1<T extends 'a' | 'b'>(key: T) {
  switch (key) {
    case 'a':
      key.toLowerCase();
      break;
    default:
      key.toLowerCase();
      break;
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
