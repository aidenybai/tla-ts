/*---
description: Ported from TypeScript's tests/cases/compiler/missingSelf.ts.
outcome: success
source: tests/cases/compiler/missingSelf.ts
---*/
// @target: es2015
class CalcButton
{
    public a() { this.onClick(); }
    public onClick() { }
}

class CalcButton2
{
    public b() { () => this.onClick(); }
    public onClick() { }
}

var c = new CalcButton();
c.a();
var c2 = new CalcButton2();
c2.b();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
