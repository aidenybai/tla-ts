/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceStaticMembersCompatible.ts.
outcome: success
source: tests/cases/compiler/inheritanceStaticMembersCompatible.ts
---*/
// @target: es2015
// @strict: false
class a {
    static x: a;
}

class b extends a {
    static x: b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
