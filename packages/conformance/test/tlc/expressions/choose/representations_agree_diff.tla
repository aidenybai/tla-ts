(*---
description: "CHOOSE over \\ on an interval picks the smallest remaining element."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE representations_agree_diff ----
EXTENDS Integers
Test == (CHOOSE x \in (1..3) \ {1} : TRUE) = 2
====

(*--- recorded
all:
  exit: 0
---*)
