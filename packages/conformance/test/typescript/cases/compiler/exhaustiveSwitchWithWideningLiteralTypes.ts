/*---
description: Ported from TypeScript's tests/cases/compiler/exhaustiveSwitchWithWideningLiteralTypes.ts.
outcome: success
source: tests/cases/compiler/exhaustiveSwitchWithWideningLiteralTypes.ts
---*/
// @target: es2015
// @strictNullChecks: true

// Repro from #12529

class A {
    readonly kind = "A"; // (property) A.kind: "A"
}

class B {
    readonly kind = "B"; // (property) B.kind: "B"
}

function f(value: A | B): number {
    switch(value.kind) {
        case "A": return 0;
        case "B": return 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
