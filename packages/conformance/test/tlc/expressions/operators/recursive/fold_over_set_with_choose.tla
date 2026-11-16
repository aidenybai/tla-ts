(*---
description: "A recursive fold over a set picks elements with CHOOSE."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE fold_over_set_with_choose ----
EXTENDS Integers
RECURSIVE SetSum(_)
SetSum(s) == IF s = {} THEN 0 ELSE LET e == CHOOSE i \in s : TRUE IN e + SetSum(s \ {e})
Test == SetSum(1..4) = 10
====

(*--- recorded
all:
  exit: 0
---*)
