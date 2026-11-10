/*---
description: Ported from TypeScript's tests/cases/compiler/argumentsUsedInObjectLiteralProperty.ts.
outcome: success
source: tests/cases/compiler/argumentsUsedInObjectLiteralProperty.ts
---*/
// @target: es2015
class A {
    public static createSelectableViewModel(initialState?: any, selectedValue?: any) {
        return {
            selectedValue: arguments.length
        };
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
