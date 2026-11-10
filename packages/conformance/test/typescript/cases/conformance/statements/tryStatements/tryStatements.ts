/*---
description: Ported from TypeScript's tests/cases/conformance/statements/tryStatements/tryStatements.ts.
outcome: success
source: tests/cases/conformance/statements/tryStatements/tryStatements.ts
---*/
// @target: es2015

function fn() {
    try { } catch { }

    try { } catch { 
        try { } catch { 
            try { } catch { }
        }
        try { } catch { }
    }

    try { } catch (x) { var x: any; }

    try { } finally { }

    try { } catch { } finally { }

    try { } catch (z) { } finally { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
