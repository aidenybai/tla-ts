(*---
description: "\\A stops at the first counterexample in normalized order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bf"
flags: [expression]
outcome: success
---*)
---- MODULE forall_stops_at_first_counterexample ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == ~\A x \in {3, 1, 2} : P(x, x # 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
