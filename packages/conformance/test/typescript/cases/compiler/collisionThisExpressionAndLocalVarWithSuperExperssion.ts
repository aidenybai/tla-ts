/*---
description: Ported from TypeScript's tests/cases/compiler/collisionThisExpressionAndLocalVarWithSuperExperssion.ts.
outcome: success
source: tests/cases/compiler/collisionThisExpressionAndLocalVarWithSuperExperssion.ts
---*/
// @target: es2015
class a {
    public foo() {
    }
}
class b extends a {
    public foo() {
        var _this = 10;
        var f = () => super.foo();
    }
}
class b2 extends a {
    public foo() {
        var f = () => {
            var _this = 10;
            return super.foo()
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
