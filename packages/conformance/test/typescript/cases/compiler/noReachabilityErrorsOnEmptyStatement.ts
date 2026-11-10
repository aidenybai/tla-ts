/*---
description: Ported from TypeScript's tests/cases/compiler/noReachabilityErrorsOnEmptyStatement.ts.
outcome: success
source: tests/cases/compiler/noReachabilityErrorsOnEmptyStatement.ts
---*/
// @target: es2015
function foo() {
    return 1;;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
