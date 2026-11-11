(*---
description: "Two operator parameters can compose."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE compose_two ----
EXTENDS Integers
Compose(f(_), g(_), a) == f(g(a))
Test == Compose(LAMBDA x : x + 1, LAMBDA x : x * 2, 3) = 7
====

(*--- recorded
all:
  exit: 0
---*)
