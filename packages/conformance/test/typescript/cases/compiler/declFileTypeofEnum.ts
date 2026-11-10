/*---
description: Ported from TypeScript's tests/cases/compiler/declFileTypeofEnum.ts.
outcome: success
source: tests/cases/compiler/declFileTypeofEnum.ts
---*/
// @target: es2015
// @declaration: true

enum days {
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday
}

var weekendDay = days.saturday;
var daysOfMonth = days;
var daysOfYear: typeof days;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
