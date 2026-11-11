(*---
description: "\\E stops at the first witness in normalized order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_be"
flags: [expression]
outcome: success
---*)
---- MODULE exists_stops_at_first_witness ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == \E x \in {3, 1, 2} : P(x, x = 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
