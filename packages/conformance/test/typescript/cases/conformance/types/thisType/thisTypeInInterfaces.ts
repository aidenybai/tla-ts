/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeInInterfaces.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeInInterfaces.ts
---*/
// @target: es2015
interface I1 {
    x: this;
    f(x: this): this;
}

interface I2 {
    (x: this): this;
    new (x: this): this;
    [x: string]: this;
}

interface Foo<T> {
    x: T;
    y: this;
}

interface I3 {
    a: this[];
    b: [this, this];
    c: this | Date;
    d: this & Date;
    e: (((this)));
    f: (x: this) => this;
    g: new (x: this) => this;
    h: Foo<this>;
    i: Foo<this | (() => this)>;
    j: (x: any) => x is this;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
