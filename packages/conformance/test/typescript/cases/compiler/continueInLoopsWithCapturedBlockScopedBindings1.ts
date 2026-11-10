/*---
description: Ported from TypeScript's tests/cases/compiler/continueInLoopsWithCapturedBlockScopedBindings1.ts.
outcome: success
source: tests/cases/compiler/continueInLoopsWithCapturedBlockScopedBindings1.ts
---*/
// @target: ES5, ES2015
function foo() {
    for (const i of [0, 1]) {
        if (i === 0) {
            continue;
        }

        // Trigger non-simple-loop emit
        (() => {
            return i;
        })();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
