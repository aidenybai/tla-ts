/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNameClassExpressionLoop.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNameClassExpressionLoop.ts
---*/
// @target: es2015
const array = [];
for (let i = 0; i < 10; ++i) {
    array.push(class C {
        #myField = "hello";
        #method() {}
        get #accessor() { return 42; }
        set #accessor(val) { }
    });
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
