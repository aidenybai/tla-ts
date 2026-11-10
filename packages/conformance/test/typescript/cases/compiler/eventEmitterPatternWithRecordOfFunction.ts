/*---
description: Ported from TypeScript's tests/cases/compiler/eventEmitterPatternWithRecordOfFunction.ts.
outcome: success
source: tests/cases/compiler/eventEmitterPatternWithRecordOfFunction.ts
---*/
// @target: es2015
// @strict: true
interface A {
    emit(event: string, ...args: any[]): boolean;
}

type Args<F> = F extends (...args: infer A) => void ? A : never;

type EventMap = Record<string, Function>;

interface B<M extends EventMap> extends A {
    emit<Event extends keyof M>(event: Event, ...args: Args<M[Event]>): boolean;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
