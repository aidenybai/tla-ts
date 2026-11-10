/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/optionalChaining/optionalChainingInParameterInitializer.ts.
outcome: success
source: tests/cases/conformance/expressions/optionalChaining/optionalChainingInParameterInitializer.ts
---*/
// @target: esnext,es2015,es5
// @noTypesAndSymbols: true

// https://github.com/microsoft/TypeScript/issues/36295
const a = (): { d: string } | undefined => undefined;
((b = a()?.d) => {})();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
