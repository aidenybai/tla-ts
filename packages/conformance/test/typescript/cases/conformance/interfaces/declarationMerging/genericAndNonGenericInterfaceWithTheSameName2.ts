/*---
description: Ported from TypeScript's tests/cases/conformance/interfaces/declarationMerging/genericAndNonGenericInterfaceWithTheSameName2.ts.
outcome: success
source: tests/cases/conformance/interfaces/declarationMerging/genericAndNonGenericInterfaceWithTheSameName2.ts
---*/
// @target: es2015
// generic and non-generic interfaces with the same name do not merge

namespace M {
    interface A<T> {
        bar: T;
    }
}

namespace M2 {
    interface A { // ok
        foo: string;
    }
}

namespace N {
    namespace M {
        interface A<T> {
            bar: T;
        }
    }

    namespace M2 {
        interface A { // ok
            foo: string;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
