/*---
description: Ported from TypeScript's tests/cases/compiler/genericsAndHigherOrderFunctions.ts.
outcome: success
source: tests/cases/compiler/genericsAndHigherOrderFunctions.ts
---*/
// @target: es2015
// no errors expected

var combine: <T, S>(f: (_: T) => S) =>
    <U>(g: (_: U) => T) =>
    (x: U) => S

    = <T, S>(f: (_: T) => S) =>
        <U>(g: (_: U) => T) =>
            (x: U) => f(g(x))

var foo: <K, N>(g: (x: K) => N) =>
    (h: <M>(_: (_: K) => (_: M) => M) => (_: M) => M) =>
    <R>(f: (_: N) => (_: R) => R) => (_: R) => R

    = <K, N>(g: (x: K) => N) =>
        (h: <M>(_: (_: K) => (_: M) => M) => (_: M) => M) =>
            <R>(f: (_: N) => (_: R) => R) => h(combine(f)(g))

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
