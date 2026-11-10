/*---
description: Ported from TypeScript's tests/cases/compiler/typePredicateTopLevelTypeParameter.ts.
outcome: success
source: tests/cases/compiler/typePredicateTopLevelTypeParameter.ts
---*/
// @target: es2015
// @strict: true

// Repro from #51980

function getPermissions(user: string) {
    if (user === 'Jack') return 'admin';
    return undefined;
}

const admins = ['Mike', 'Joe'].map(e => getPermissions(e));

function isDefined<T>(a: T | undefined): a is T {
    return a !== undefined;
}

const foundAdmins = admins.filter(isDefined);  // "admin"[]

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
