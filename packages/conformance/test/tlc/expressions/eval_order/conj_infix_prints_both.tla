(*---
description: "/\\ with a true left operand evaluates both operands in order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_land"
flags: [expression]
outcome: success
---*)
---- MODULE conj_infix_prints_both ----
EXTENDS Integers, TLC
Test == PrintT(1) /\ PrintT(2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
