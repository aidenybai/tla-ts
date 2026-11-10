/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperatorInParameterInitializer.ts.
outcome: success
source: tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperatorInParameterInitializer.ts
---*/
// @strict: false
// @target: esnext,es2015,es5
// @noTypesAndSymbols: true

// https://github.com/microsoft/TypeScript/issues/36295
const a = (): string | undefined => undefined;
((b = a() ?? "d") => {})();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
