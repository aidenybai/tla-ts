/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnClassAccessor2.ts.
outcome: success
source: tests/cases/compiler/commentOnClassAccessor2.ts
---*/
// @target: es2015
class C {
  /**
   * Getter.
   */
  get bar(): number { return 1;}

  /**
   * Setter.
   */
  set bar(v) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
