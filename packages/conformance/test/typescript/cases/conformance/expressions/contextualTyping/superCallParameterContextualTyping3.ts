/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/contextualTyping/superCallParameterContextualTyping3.ts.
outcome: success
source: tests/cases/conformance/expressions/contextualTyping/superCallParameterContextualTyping3.ts
---*/
﻿// @target: es2015
interface ContextualType<T> {
    method(parameter: T): void;
}

class CBase<T>  {
    constructor(param: ContextualType<T>) {
    }

    foo(param: ContextualType<T>) {
    }
}

class C extends CBase<string> {
    constructor() {
        // Should be okay.
        // 'p' should have type 'string'.
        super({
            method(p) {
                p.length;
            }
        });

        // Should be okay.
        // 'p' should have type 'string'.
        super.foo({
            method(p) {
                p.length;
            }
        });
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
