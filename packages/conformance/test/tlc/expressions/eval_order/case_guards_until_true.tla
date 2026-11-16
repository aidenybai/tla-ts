(*---
description: "CASE evaluates guards in source order and stops at the first true one."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_guards_until_true ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == (CASE P(1, FALSE) -> P(2, 5) [] P(3, TRUE) -> P(4, 6) [] P(5, TRUE) -> P(6, 7)) = 6
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 3
    | 4
---*)
