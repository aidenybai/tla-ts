/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperatorInParameterInitializer.2.ts.
outcome: success
source: tests/cases/conformance/expressions/nullishCoalescingOperator/nullishCoalescingOperatorInParameterInitializer.2.ts
---*/
// @strict: false
// @target: esnext,es2015,es5
// @noTypesAndSymbols: true
// @noEmit: true

// https://github.com/microsoft/TypeScript/issues/36295
const a = (): string | undefined => undefined;
((b = a() ?? "d") => { var a; })();

const x = "";
((b = a() ?? "d", d = x) => { var x; })();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
