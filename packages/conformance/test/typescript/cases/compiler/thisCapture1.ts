/*---
description: Ported from TypeScript's tests/cases/compiler/thisCapture1.ts.
outcome: success
source: tests/cases/compiler/thisCapture1.ts
---*/
// @target: es2015
class X {
    private y = 0;
    public getSettings(keys: string[]): any {
        var ret: any;
        return ret.always(() => {
            this.y = 0;
        }).promise();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
