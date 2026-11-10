/*---
description: Ported from TypeScript's tests/cases/compiler/doubleUnderscoreLabels.ts.
outcome: success
source: tests/cases/compiler/doubleUnderscoreLabels.ts
---*/
// @target: es2015
function doThing() {
    __call: while (true) {
        aLabel: for (let i = 0; i < 10; i++) {
            if (i === 3) {
                break __call;
            }
            if (i === 5) {
                break aLabel;
            }
        }
    }
}
doThing();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
