/*---
description: Ported from TypeScript's tests/cases/compiler/collisionCodeGenModuleWithEnumMemberConflict.ts.
outcome: success
source: tests/cases/compiler/collisionCodeGenModuleWithEnumMemberConflict.ts
---*/
// @target: es2015
namespace m1 {
    enum e {
        m1, 
        m2 = m1
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
