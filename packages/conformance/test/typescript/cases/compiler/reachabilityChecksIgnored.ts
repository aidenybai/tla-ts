/*---
description: Ported from TypeScript's tests/cases/compiler/reachabilityChecksIgnored.ts.
outcome: success
source: tests/cases/compiler/reachabilityChecksIgnored.ts
---*/
// @target: es2015
// @allowUnreachableCode: false
// @preserveConstEnums: true


function a() {
    throw new Error("");

    // @ts-ignore
    console.log("unreachable");
}

function b() {
    throw new Error("");

    // @ts-expect-error
    console.log("unreachable");
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
