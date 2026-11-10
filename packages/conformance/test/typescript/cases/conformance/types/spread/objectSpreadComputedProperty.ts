/*---
description: Ported from TypeScript's tests/cases/conformance/types/spread/objectSpreadComputedProperty.ts.
outcome: success
source: tests/cases/conformance/types/spread/objectSpreadComputedProperty.ts
---*/
// @target: es2015
// fixes #12200
function f() {
    let n: number = 12;
    let m: number = 13;
    let a: any = null;
    const o1 = { ...{}, [n]: n };
    const o2 = { ...{}, [a]: n };
    const o3 = { [a]: n, ...{}, [n]: n, ...{}, [m]: m };
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
