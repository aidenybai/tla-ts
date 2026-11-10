(*---
description: "A function can take three arguments."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fc"
flags: [expression]
outcome: success
---*)
---- MODULE three_bounds ----
EXTENDS Integers, FiniteSets
F == [x, y \in 1..2, z \in {5} |-> x + y + z]
Test == F[2, 2, 5] = 9 /\ Cardinality(DOMAIN F) = 4
====

(*--- recorded
all:
  exit: 0
---*)
