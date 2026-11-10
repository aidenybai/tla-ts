(*---
description: "f[a, b] and f[<<a, b>>] are the same application."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE comma_is_tuple ----
EXTENDS Integers
F == [x \in 1..2, y \in 1..2 |-> x * 10 + y]
Test == F[2, 1] = 21 /\ F[<<2, 1>>] = 21
====

(*--- recorded
all:
  exit: 0
---*)
