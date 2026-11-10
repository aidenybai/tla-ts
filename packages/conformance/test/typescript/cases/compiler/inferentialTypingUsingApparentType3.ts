/*---
description: Ported from TypeScript's tests/cases/compiler/inferentialTypingUsingApparentType3.ts.
outcome: success
source: tests/cases/compiler/inferentialTypingUsingApparentType3.ts
---*/
// @target: es2015
interface Field<T> {
    clean(input: T): T
}

class CharField implements Field<string> {
    clean(input: string) {
        return "Yup";
    }
}

class NumberField implements Field<number> {
    clean(input: number) {
        return 123;
    }
}

class ObjectField<A, T extends { [name: string]: Field<any> }> {
    constructor(public fields: T) { }
}

var person = new ObjectField({
    id: new NumberField(),
    name: new CharField()
});

person.fields.id;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
