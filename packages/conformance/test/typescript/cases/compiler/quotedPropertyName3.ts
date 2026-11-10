/*---
description: Ported from TypeScript's tests/cases/compiler/quotedPropertyName3.ts.
outcome: success
source: tests/cases/compiler/quotedPropertyName3.ts
---*/
// @target: es2015
class Test {
    "prop1": number;
    foo() {
        var x = () => this["prop1"];
        var y: number = x();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
