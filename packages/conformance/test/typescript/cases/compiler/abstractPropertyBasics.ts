/*---
description: Ported from TypeScript's tests/cases/compiler/abstractPropertyBasics.ts.
outcome: success
source: tests/cases/compiler/abstractPropertyBasics.ts
---*/
//@target: ES5, ES2015
interface A {
    prop: string;
    raw: string;
    m(): void;
}
abstract class B implements A {
    abstract prop: string;
    abstract raw: string;
    abstract readonly ro: string;
    abstract get readonlyProp(): string;
    abstract set readonlyProp(val: string);
    abstract m(): void;
}
class C extends B {
    get prop() { return "foo"; }
    set prop(v) { }
    raw = "edge";
    readonly ro = "readonly please";
    readonlyProp!: string;
    m() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
