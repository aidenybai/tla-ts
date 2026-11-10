/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/ErrorRecovery/AccessibilityAfterStatic/parserAccessibilityAfterStatic4.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/ErrorRecovery/AccessibilityAfterStatic/parserAccessibilityAfterStatic4.ts
---*/
// @target: es2015
class Outer
{
static public: number;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
