(*---
description: "A set enumeration evaluates its elements in source order, not in value order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_se"
flags: [expression]
outcome: success
---*)
---- MODULE set_enum_left_to_right ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == {P(3, 3), P(1, 1), P(2, 2)} = {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 3
    | 1
    | 2
---*)
