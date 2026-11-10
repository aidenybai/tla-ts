/*---
description: Ported from TypeScript's tests/cases/conformance/emitter/es2019/noCatchBinding/emitter.noCatchBinding.es2019.ts.
outcome: success
source: tests/cases/conformance/emitter/es2019/noCatchBinding/emitter.noCatchBinding.es2019.ts
---*/
// @target: es2019
function f() {
    try { } catch { }
    try { } catch { 
        try { } catch { }
    }
    try { } catch { } finally { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
