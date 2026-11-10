/*---
description: Ported from TypeScript's tests/cases/compiler/noUnusedLocals_selfReference_skipsBlockLocations.ts.
outcome: success
source: tests/cases/compiler/noUnusedLocals_selfReference_skipsBlockLocations.ts
---*/
// @target: es2015
// @noUnusedLocals: true

namespace n {
    function f() {
        f;
    }

    switch (0) {
        case 0:
            function g() {
                g;
            }
        default:
            function h() {
                h;
            }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
