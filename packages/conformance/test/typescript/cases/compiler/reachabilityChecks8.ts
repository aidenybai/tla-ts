/*---
description: Ported from TypeScript's tests/cases/compiler/reachabilityChecks8.ts.
outcome: success
source: tests/cases/compiler/reachabilityChecks8.ts
---*/
// @target: es2015
// @allowUnreachableCode: false

try {
    for (
        (function () { throw "1"; })();
        (function () { throw "2"; })();
        (function () { throw "3"; })()
    ) {}
} catch (e) {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
