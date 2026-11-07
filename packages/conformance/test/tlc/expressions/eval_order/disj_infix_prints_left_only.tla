(*---
description: "\\/ with a true left operand does not evaluate the right."
ref: "tlc2/tool/impl/Tool.java#OPCODE_lor"
flags: [expression]
outcome: success
---*)
---- MODULE disj_infix_prints_left_only ----
EXTENDS Integers, TLC
Test == PrintT(1) \/ PrintT(2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
