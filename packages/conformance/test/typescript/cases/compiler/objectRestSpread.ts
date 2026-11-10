/*---
description: Ported from TypeScript's tests/cases/compiler/objectRestSpread.ts.
outcome: success
source: tests/cases/compiler/objectRestSpread.ts
---*/
// @strict: false
// @target: es2017
// @lib: es2018
// @noTypesAndSymbols: true
let obj = {};

({...obj});
let {
    prop = { ...obj },
    more = { ...obj } = { ...obj },
    ['' + 'other']: other = { ...obj },
    yetAnother: {nested: { ['nested' + 'prop']: nestedProp = { ...obj }, ...nestedRest } = { ...obj }} = { ...obj },
    fn = async function*() {},
    ...props
} = {} as any;

({
    prop = { ...obj },
    ['' + 'other']: other = { ...obj },
    ...props
} = {} as any)

function test({
    prop = { ...obj },
    ...props
}) {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
