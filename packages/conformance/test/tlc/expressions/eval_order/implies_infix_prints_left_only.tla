(*---
description: "=> with a false left operand does not evaluate the right."
ref: "tlc2/tool/impl/Tool.java#OPCODE_implies"
flags: [expression]
outcome: success
---*)
---- MODULE implies_infix_prints_left_only ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, FALSE) => P(2, TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
