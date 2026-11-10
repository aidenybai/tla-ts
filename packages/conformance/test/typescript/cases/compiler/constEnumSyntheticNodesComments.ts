/*---
description: Ported from TypeScript's tests/cases/compiler/constEnumSyntheticNodesComments.ts.
outcome: success
source: tests/cases/compiler/constEnumSyntheticNodesComments.ts
---*/
// @target: es2015
const enum En { A, B, C, D }

function assert<T>(x: T) {
    return x;
}

function verify(a: En) {
    switch (a) {
        case En.A:
            return assert<0>(a);
        case En["B"]:
            return assert<1>(a);
        case En[`C`]:
            return assert<2>(a);
        case En["\u{44}"]:
            return assert<3>(a);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
