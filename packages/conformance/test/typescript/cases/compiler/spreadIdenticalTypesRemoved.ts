/*---
description: Ported from TypeScript's tests/cases/compiler/spreadIdenticalTypesRemoved.ts.
outcome: success
source: tests/cases/compiler/spreadIdenticalTypesRemoved.ts
---*/
// @target: es2015
// @strict: true
interface Animal {
    name: string;
    kind: string;
    age: number;
    location: string;
    owner: object;
}

function clonePet(pet: Animal, fullCopy?: boolean) {
    return {
        name: pet.name,
        kind: pet.kind,
        ...(fullCopy && pet),
    }
}

interface Animal2 {
    name: string;
    owner?: string;
}
function billOwner(pet: Animal2) {
    return {
        ...(pet.owner && pet),
        paid: false
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
