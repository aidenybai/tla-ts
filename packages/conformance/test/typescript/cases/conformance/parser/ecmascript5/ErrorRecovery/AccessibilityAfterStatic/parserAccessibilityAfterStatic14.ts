/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/ErrorRecovery/AccessibilityAfterStatic/parserAccessibilityAfterStatic14.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/ErrorRecovery/AccessibilityAfterStatic/parserAccessibilityAfterStatic14.ts
---*/
// @target: es2015
class Outer
{
static public<T>() {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
