/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNameInLhsReceiverExpression.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNameInLhsReceiverExpression.ts
---*/
// @target: es2015

class Test {
    #y = 123;
    static something(obj: { [key: string]: Test }) {
        obj[(new class { #x = 1; readonly s = "prop"; }).s].#y = 1;
        obj[(new class { #x = 1; readonly s = "prop"; }).s].#y += 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
