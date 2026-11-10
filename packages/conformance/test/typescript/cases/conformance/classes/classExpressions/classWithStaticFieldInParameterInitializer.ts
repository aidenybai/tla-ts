/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classExpressions/classWithStaticFieldInParameterInitializer.ts.
outcome: success
source: tests/cases/conformance/classes/classExpressions/classWithStaticFieldInParameterInitializer.ts
---*/
// @target: esnext,es2015,es5
// @noTypesAndSymbols: true

// https://github.com/microsoft/TypeScript/issues/36295
((b = class { static x = 1 }) => {})();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
