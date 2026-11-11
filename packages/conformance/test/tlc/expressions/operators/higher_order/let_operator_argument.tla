(*---
description: "A LET operator can be passed by name and keeps its closure."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE let_operator_argument ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == LET k == 5
            Add(x) == x + k
        IN Apply(Add, 1) = 6
====

(*--- recorded
all:
  exit: 0
---*)
