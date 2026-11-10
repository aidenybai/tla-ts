/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnClassMethod1.ts.
outcome: success
source: tests/cases/compiler/commentOnClassMethod1.ts
---*/
// @target: es2015
// @removeComments: false
class WebControls {
    /**
     * Render a control
     */
    createControl(): any {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
