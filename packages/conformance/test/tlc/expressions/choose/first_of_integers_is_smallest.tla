(*---
description: "CHOOSE picks the smallest satisfying element in normalized order, not the first in source order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE first_of_integers_is_smallest ----
EXTENDS Integers
Test == (CHOOSE x \in {3, 1, 2} : TRUE) = 1
====

(*--- recorded
all:
  exit: 0
---*)
