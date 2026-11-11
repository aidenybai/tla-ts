(*---
description: "A recursive function can take two arguments."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rfs"
flags: [expression]
outcome: success
---*)
---- MODULE two_arguments ----
EXTENDS Integers
F[x, y \in 0..3] == IF x = 0 THEN y ELSE F[x - 1, y] + 1
Test == F[2, 3] = 5
====

(*--- recorded
all:
  exit: 0
---*)
