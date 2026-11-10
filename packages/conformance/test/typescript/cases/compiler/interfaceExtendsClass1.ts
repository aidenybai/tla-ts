/*---
description: Ported from TypeScript's tests/cases/compiler/interfaceExtendsClass1.ts.
outcome: success
source: tests/cases/compiler/interfaceExtendsClass1.ts
---*/
// @target: es2015
// @lib: es5
class Control {
    private state: any;
}
interface SelectableControl extends Control {
    select(): void;
}
class Button extends Control {
    select() { }
}
class TextBox extends Control {
    select() { }
}
class Image extends Control {
}
class Location {
    select() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
