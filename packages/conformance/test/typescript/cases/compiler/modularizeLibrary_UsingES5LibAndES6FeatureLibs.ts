/*---
description: Ported from TypeScript's tests/cases/compiler/modularizeLibrary_UsingES5LibAndES6FeatureLibs.ts.
outcome: success
source: tests/cases/compiler/modularizeLibrary_UsingES5LibAndES6FeatureLibs.ts
---*/
﻿// @lib: es5,es2015.core,es2015.symbol,es2015.proxy,es2015.generator,es2015.iterable,es2015.reflect
// @target: es6

var s = Symbol();
var t = {};
var p = new Proxy(t, {});

Reflect.ownKeys({});

function* idGen() {
    let i = 10;
    while (i < 20) {
        yield i + 2;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
