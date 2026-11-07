(*---
description: "\\cup evaluates its left operand first."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cup"
flags: [expression]
outcome: success
---*)
---- MODULE cup_left_then_right ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (P(1, {1}) \cup P(2, {2})) = {1, 2}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
