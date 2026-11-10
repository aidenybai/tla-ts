/*---
description: Ported from TypeScript's tests/cases/compiler/commentBeforeStaticMethod1.ts.
outcome: success
source: tests/cases/compiler/commentBeforeStaticMethod1.ts
---*/
// @target: es2015
class C {
  /**
   * Returns bar
   */
  public static foo(): string {
    return "bar";
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
