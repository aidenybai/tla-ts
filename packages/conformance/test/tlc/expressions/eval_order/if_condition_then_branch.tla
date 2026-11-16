(*---
description: "IF evaluates its condition and then only the taken branch."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ite"
flags: [expression]
outcome: success
---*)
---- MODULE if_condition_then_branch ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (IF P(1, TRUE) THEN P(2, 5) ELSE P(3, 6)) = 5
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
