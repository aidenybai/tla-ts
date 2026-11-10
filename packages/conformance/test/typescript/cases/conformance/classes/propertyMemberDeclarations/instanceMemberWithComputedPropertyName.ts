/*---
description: Ported from TypeScript's tests/cases/conformance/classes/propertyMemberDeclarations/instanceMemberWithComputedPropertyName.ts.
outcome: success
source: tests/cases/conformance/classes/propertyMemberDeclarations/instanceMemberWithComputedPropertyName.ts
---*/
// @target: es2015
// https://github.com/microsoft/TypeScript/issues/30953
"use strict";
const x = 1;
class C {
    [x] = true;
    constructor() {
        const { a, b } = { a: 1, b: 2 };
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
