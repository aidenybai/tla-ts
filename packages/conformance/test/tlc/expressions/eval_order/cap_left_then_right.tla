(*---
description: "\\cap evaluates its left operand first."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cap"
flags: [expression]
outcome: success
---*)
---- MODULE cap_left_then_right ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (P(1, {1}) \cap P(2, {1})) = {1}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
