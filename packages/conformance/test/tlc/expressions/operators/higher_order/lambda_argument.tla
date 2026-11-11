(*---
description: "A LAMBDA can be passed for an operator parameter."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE lambda_argument ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(LAMBDA x : x + 1, 2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
