/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/contextualTyping/superCallParameterContextualTyping1.ts.
outcome: success
source: tests/cases/conformance/expressions/contextualTyping/superCallParameterContextualTyping1.ts
---*/
﻿// @target: es2015

class A<T1, T2> {
    constructor(private map: (value: T1) => T2) {

    }
}

class B extends A<number, string> {
    // Ensure 'value' is of type 'number (and not '{}') by using its 'toExponential()' method.
    constructor() { super(value => String(value.toExponential())); }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
