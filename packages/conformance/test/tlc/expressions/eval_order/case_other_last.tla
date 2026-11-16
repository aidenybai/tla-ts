(*---
description: "CASE takes OTHER only after every guard is false."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_other_last ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (CASE P(1, FALSE) -> 5 [] P(2, FALSE) -> 6 [] OTHER -> P(3, 7)) = 7
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
