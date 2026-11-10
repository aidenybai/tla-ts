/*---
description: Ported from TypeScript's tests/cases/compiler/this_inside-object-literal-getters-and-setters.ts.
outcome: success
source: tests/cases/compiler/this_inside-object-literal-getters-and-setters.ts
---*/
// @target: es2015
namespace ObjectLiteral {
    var ThisInObjectLiteral = {
        _foo: '1',
        get foo(): string {
            return this._foo;
        },
        set foo(value: string) {
            this._foo = value;
        },
        test: function () {
            return this._foo;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
