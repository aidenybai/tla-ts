(*---
description: "A recursive function definition computes through self-reference."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rfs"
flags: [expression]
outcome: success
---*)
---- MODULE factorial ----
EXTENDS Integers
F[n \in 0..4] == IF n = 0 THEN 1 ELSE n * F[n - 1]
Test == F[4] = 24
====

(*--- recorded
all:
  exit: 0
---*)
