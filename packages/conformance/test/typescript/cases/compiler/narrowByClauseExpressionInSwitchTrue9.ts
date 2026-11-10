/*---
description: Ported from TypeScript's tests/cases/compiler/narrowByClauseExpressionInSwitchTrue9.ts.
outcome: success
source: tests/cases/compiler/narrowByClauseExpressionInSwitchTrue9.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

interface IProps {
    one: boolean;
}

class Foo {
    mine: string = "";

    myMethod(x: IProps) {
        const { one } = x;
        switch (true) {
            case one:
                break;
            default:
                let x = this.mine;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
