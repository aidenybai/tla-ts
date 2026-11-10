/*---
description: Ported from TypeScript's tests/cases/compiler/spreadTypeRemovesReadonly.ts.
outcome: success
source: tests/cases/compiler/spreadTypeRemovesReadonly.ts
---*/
// @target: es2015
interface ReadonlyData {
    readonly value: string;
}

const data: ReadonlyData = { value: 'foo' };
const clone = { ...data };
clone.value = 'bar';

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
