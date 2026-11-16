(*---
description: "A tuple evaluates its components left to right."
ref: "tlc2/tool/impl/Tool.java#OPCODE_tup"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_left_to_right ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == <<P(1, 1), P(2, 2), P(3, 3)>> = <<1, 2, 3>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
