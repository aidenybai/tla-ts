/*---
description: Ported from TypeScript's tests/cases/compiler/tryCatchFinally.ts.
outcome: success
source: tests/cases/compiler/tryCatchFinally.ts
---*/
// @target: es2015
try { } catch(e) { } finally { } 

try {} catch(e) {}

try {} finally {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
