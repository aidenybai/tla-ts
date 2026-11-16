(*---
description: "FALSE => Q returns TRUE without evaluating Q."
ref: "tlc2/tool/impl/Tool.java#OPCODE_implies"
flags: [expression]
outcome: success
---*)
---- MODULE implies_false_skips_right_error ----
EXTENDS Integers
Test == FALSE => 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
