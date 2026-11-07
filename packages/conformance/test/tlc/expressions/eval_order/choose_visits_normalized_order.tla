(*---
description: "CHOOSE tests the predicate in normalized order and stops at the first match."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE choose_visits_normalized_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (CHOOSE x \in {3, 1, 2} : P(x, x > 1)) = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
