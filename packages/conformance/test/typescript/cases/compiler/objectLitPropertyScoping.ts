/*---
description: Ported from TypeScript's tests/cases/compiler/objectLitPropertyScoping.ts.
outcome: success
source: tests/cases/compiler/objectLitPropertyScoping.ts
---*/
// @target: es2015
// Should compile, x and y should not be picked up from the properties

function makePoint(x: number, y: number) {
    return {
        get x() {
            return x;
        },
        get y() {
            return y;
        },
        dist: function () {
            return Math.sqrt(x * x + y * y);
        }
    }
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
