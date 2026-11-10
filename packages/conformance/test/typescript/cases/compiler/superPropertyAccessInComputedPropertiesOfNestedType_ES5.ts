/*---
description: Ported from TypeScript's tests/cases/compiler/superPropertyAccessInComputedPropertiesOfNestedType_ES5.ts.
outcome: success
source: tests/cases/compiler/superPropertyAccessInComputedPropertiesOfNestedType_ES5.ts
---*/
// @target: ES5, ES2015
class A {
    foo() { return 1; }
}

class B extends A {
    foo() { return 2; }
    bar() {
        return class {
            [super.foo()]() {
                return 100;
            }
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
