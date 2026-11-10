/*---
description: Ported from TypeScript's tests/cases/compiler/typePredicatesOptionalChaining2.ts.
outcome: success
source: tests/cases/compiler/typePredicatesOptionalChaining2.ts
---*/
// @target: es2015
// @strict: true

type Person = { name: string; }

const getName1 = (person?: Person): string => {
  return typeof person?.name === 'string' ? person?.name : '';
};

const isString = (value: any): value is string => {
  return typeof value === 'string';
};

const getName2 = (person?: Person): string => {
  return isString(person?.name) ? person?.name : '';
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
