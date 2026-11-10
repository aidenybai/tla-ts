/*---
description: Ported from TypeScript's tests/cases/conformance/types/contextualTypes/methodDeclarations/contextuallyTypedObjectLiteralMethodDeclaration01.ts.
outcome: success
source: tests/cases/conformance/types/contextualTypes/methodDeclarations/contextuallyTypedObjectLiteralMethodDeclaration01.ts
---*/
// @target: es2015
// @noImplicitAny: true

interface A {
    numProp: number;
}

interface B  {
    strProp: string;
}

interface Foo {
    method1(arg: A): void;
    method2(arg: B): void;
}

function getFoo1(): Foo {
    return {
        method1(arg) {
            arg.numProp = 10;
        },
        method2(arg) {
            arg.strProp = "hello";
        }
    }
}

function getFoo2(): Foo {
    return {
        method1: (arg) => {
            arg.numProp = 10;
        },
        method2: (arg) => {
            arg.strProp = "hello";
        }
    }
}

function getFoo3(): Foo {
    return {
        method1: function (arg) {
            arg.numProp = 10;
        },
        method2: function (arg) {
            arg.strProp = "hello";
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
