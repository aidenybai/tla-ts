/*---
description: Ported from TypeScript's tests/cases/compiler/optionalParamInOverride.ts.
outcome: success
source: tests/cases/compiler/optionalParamInOverride.ts
---*/
// @target: es2015
class Z {
    public func(): void { }
}
class Y extends Z {
    public func(value?: any): void { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
