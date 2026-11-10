/*---
description: Ported from TypeScript's tests/cases/conformance/types/mapped/mappedTypeOverlappingStringEnumKeys.ts.
outcome: success
source: tests/cases/conformance/types/mapped/mappedTypeOverlappingStringEnumKeys.ts
---*/
// @target: es2015
// #37859

enum TerrestrialAnimalTypes {
  CAT = "cat",
  DOG = "dog"
};

enum AlienAnimalTypes {
  CAT = "cat",
};

type AnimalTypes = TerrestrialAnimalTypes | AlienAnimalTypes;

interface TerrestrialCat {
  type: TerrestrialAnimalTypes.CAT;
  address: string;
}

interface AlienCat {
  type: AlienAnimalTypes.CAT
  planet: string;
}

type Cats = TerrestrialCat | AlienCat;

type CatMap = {
  [V in AnimalTypes]: Extract<Cats, { type: V }>[]
};

const catMap: CatMap = {
  cat: [
    { type: TerrestrialAnimalTypes.CAT, address: "" },
    { type: AlienAnimalTypes.CAT, planet: "" }
  ],
  dog: [] as never[]
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
