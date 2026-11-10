/*---
description: Ported from TypeScript's tests/cases/compiler/unusedPrivateVariableInClass5.ts.
outcome: success
source: tests/cases/compiler/unusedPrivateVariableInClass5.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

class greeter {
    private x!: string;
    private y!: string;
    public  z!: string;

    constructor() {
        this.x;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
