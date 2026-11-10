/*---
description: Ported from TypeScript's tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty9.ts.
outcome: success
source: tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty9.ts
---*/
// @noUnusedLocals: true
// @strict: true
// @target: esnext

class C1 {
    private a = "a"; // ok
    private b = "b"; // ok

    private c = "c"; // error unused prop
    private d = "d"; // error unused prop

    getValue(key: "a" | "b") {
        return this[key];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
