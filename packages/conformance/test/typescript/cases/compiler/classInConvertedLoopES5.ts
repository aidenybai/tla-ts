/*---
description: Ported from TypeScript's tests/cases/compiler/classInConvertedLoopES5.ts.
outcome: success
source: tests/cases/compiler/classInConvertedLoopES5.ts
---*/
// @target: es5, es2015
const classesByRow: Record<string, object> = {};
for (const row of ['1', '2', '3', '4', '5']) {
  class RowClass {
    row = row;
    static factory = () => new RowClass();
  }

  classesByRow[row] = RowClass;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
