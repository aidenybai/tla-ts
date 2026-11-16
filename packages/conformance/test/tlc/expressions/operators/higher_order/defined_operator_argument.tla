(*---
description: "A defined operator can be passed by name."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE defined_operator_argument ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Inc(x) == x + 1
Test == Apply(Inc, 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
