(*---
description: "IF with a false condition evaluates only the ELSE branch."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ite"
flags: [expression]
outcome: success
---*)
---- MODULE if_condition_else_branch ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (IF P(1, FALSE) THEN P(2, 5) ELSE P(3, 6)) = 6
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 3
---*)
