(*---
description: "<=> evaluates both operands even when the left decides nothing."
ref: "tlc2/tool/impl/Tool.java#OPCODE_equiv"
flags: [expression]
outcome: success
---*)
---- MODULE equiv_prints_both ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, FALSE) <=> P(2, FALSE)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
