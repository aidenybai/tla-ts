/*---
description: Ported from TypeScript's tests/cases/compiler/functionSubtypingOfVarArgs2.ts.
outcome: success
source: tests/cases/compiler/functionSubtypingOfVarArgs2.ts
---*/
// @target: es2015
// @strict: false
class EventBase {
    private _listeners: { (...args: any[]): void; }[] = [];

    add(listener: (...args: any[]) => void): void {
        this._listeners.push(listener);
    }
}

class StringEvent extends EventBase {
    add(listener: (items: string, moreitems: number) => void ) {
        super.add(listener);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
