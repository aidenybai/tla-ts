(*---
description: "An operator parameter can be passed to another operator."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE parameter_passed_on ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Twice(f(_), a) == Apply(f, Apply(f, a))
Test == Twice(LAMBDA x : x * 2, 1) = 4
====

(*--- recorded
all:
  exit: 0
---*)
