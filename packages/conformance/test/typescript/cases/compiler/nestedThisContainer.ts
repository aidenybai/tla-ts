/*---
description: Ported from TypeScript's tests/cases/compiler/nestedThisContainer.ts.
outcome: success
source: tests/cases/compiler/nestedThisContainer.ts
---*/
// @target: es2015
// @noImplicitThis:true

type Foo = any;

const foo: Foo = {};

foo.bar = function () {
    const self: Foo = this;
};

foo.zab = (function () {
    const self: Foo = this;
});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
