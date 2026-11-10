/*---
description: Ported from TypeScript's tests/cases/compiler/inferenceUnionOfObjectsMappedContextualType.ts.
outcome: success
source: tests/cases/compiler/inferenceUnionOfObjectsMappedContextualType.ts
---*/
// @target: es2015
// @strict: true
type Entity = {
    someDate: Date | null;
} & ({ id: string; } | { id: number; })

type RowRendererMeta<TInput extends {}> = {
    [key in keyof TInput]: { key: key; caption: string; formatter?: (value: TInput[key]) => string; };
}

type RowRenderer<TInput extends {}> = RowRendererMeta<TInput>[keyof RowRendererMeta<TInput>];

const test: RowRenderer<Entity> = {
    key: 'someDate',
    caption: 'My Date',
    formatter: (value) => value ? value.toString() : '-' // value: any
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
