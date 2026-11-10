/*---
description: Ported from TypeScript's tests/cases/compiler/narrowedConstInMethod.ts.
outcome: success
source: tests/cases/compiler/narrowedConstInMethod.ts
---*/
// @target: es2015
// @strictNullChecks: true

// Fixes #10501, possibly null 'x'
function f() {
    const x: string | null = <any>{};
    if (x !== null) {
        return {
            bar() { return x.length; }  // ok
        };
    }
}

function f2() {
    const x: string | null = <any>{};
    if (x !== null) {
        return class {
            bar() { return x.length; }  // ok
        };
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
