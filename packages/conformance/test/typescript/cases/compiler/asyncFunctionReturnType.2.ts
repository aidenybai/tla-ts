/*---
description: Ported from TypeScript's tests/cases/compiler/asyncFunctionReturnType.2.ts.
outcome: success
source: tests/cases/compiler/asyncFunctionReturnType.2.ts
---*/
// @target: esnext

// https://github.com/microsoft/TypeScript/issues/47291
class X {
    f = async (): Promise<this> => this;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
