(*---
description: "A LET-defined operator can be passed to a higher-order operator."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE let_operator_passed_as_argument ----
EXTENDS Integers
Apply(g(_), z) == g(z)
Test == LET inc(z) == z + 1 IN Apply(inc, 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
