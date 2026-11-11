(*---
description: "CHOOSE over [S -> T] compares functions by values in domain order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE function_set_lexicographic_values ----
EXTENDS Integers
Test == (CHOOSE f \in [{1, 2} -> {0, 1}] : f[1] = 1) = <<1, 0>>
====

(*--- recorded
all:
  exit: 0
---*)
