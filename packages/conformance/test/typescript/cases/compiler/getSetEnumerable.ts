/*---
description: Ported from TypeScript's tests/cases/compiler/getSetEnumerable.ts.
outcome: success
source: tests/cases/compiler/getSetEnumerable.ts
---*/
// @target: ES5, ES2015

class GetSetEnumerableClassGet {
    get prop() { return true;}
}

class GetSetEnumerableClassSet {
    set prop(value: boolean) { }
}

class GetSetEnumerableClassGetSet {
    get prop() { return true;}
    set prop(value: boolean) { }
}

const GetSetEnumerableObjectGet = {
    get prop() { return true; }
};

const GetSetEnumerableObjectSet = {
    set prop(value: boolean) { }
};

const GetSetEnumerableObjectGetSet = {
    get prop() { return true; },
    set prop(value: boolean) { }
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
