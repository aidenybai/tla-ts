/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeInTaggedTemplateCall.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeInTaggedTemplateCall.ts
---*/
// @target: esnext

class Foo {
    static m<T>(this: new () => T, strings: TemplateStringsArray | string) {
        return new this()
    }
}

Foo.m`test`;
(Foo.m)`test`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
