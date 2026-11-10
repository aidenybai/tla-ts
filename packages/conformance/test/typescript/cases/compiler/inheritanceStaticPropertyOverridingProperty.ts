/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceStaticPropertyOverridingProperty.ts.
outcome: success
source: tests/cases/compiler/inheritanceStaticPropertyOverridingProperty.ts
---*/
// @target: es2015
// @strict: false
class a {
    static x: () => string;
}

class b extends a {
    static x: () => string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
