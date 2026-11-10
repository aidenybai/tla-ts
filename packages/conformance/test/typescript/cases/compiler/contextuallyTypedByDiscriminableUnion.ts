/*---
description: Ported from TypeScript's tests/cases/compiler/contextuallyTypedByDiscriminableUnion.ts.
outcome: success
source: tests/cases/compiler/contextuallyTypedByDiscriminableUnion.ts
---*/
// @target: es2015
// @noImplicitAny: true
type ADT = {
    kind: "a",
    method(x: string): number;
} | {
    kind: "b",
    method(x: number): string;
};


function invoke(item: ADT) {
    if (item.kind === "a") {
        item.method("");
    }
    else {
        item.method(42);
    }
}

invoke({
    kind: "a",
    method(a) {
        return +a;
    }
});

const kind = "a"
invoke({
    kind,
    method(a) {
        return +a;
    }
})

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
