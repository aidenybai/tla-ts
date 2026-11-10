/*---
description: Ported from TypeScript's tests/cases/compiler/capturedLetConstInLoop13.ts.
outcome: success
source: tests/cases/compiler/capturedLetConstInLoop13.ts
---*/
// @target: es2015
// @strict: false
class Main {

    constructor() {
        this.register("a", "b", "c");
    }

    private register(...names: string[]): void {
        for (let name of names) {

            this.bar({
                [name + ".a"]: () => { this.foo(name); },
            });
        }
    }

    private bar(a: any): void { }

    private foo(name: string): void { }

}

new Main();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
