/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/optionalChaining/optionalChainingInArrow.ts.
outcome: success
source: tests/cases/conformance/expressions/optionalChaining/optionalChainingInArrow.ts
---*/
// @target: es5, es2015
// @noTypesAndSymbols: true
// https://github.com/microsoft/TypeScript/issues/41814
const test = (names: string[]) =>
    // single-line comment
    names?.filter(x => x);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
