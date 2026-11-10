/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/ErrorRecovery/AccessibilityAfterStatic/parserAccessibilityAfterStatic3.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/ErrorRecovery/AccessibilityAfterStatic/parserAccessibilityAfterStatic3.ts
---*/
// @target: es2015
class Outer
{
static public = 1;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
