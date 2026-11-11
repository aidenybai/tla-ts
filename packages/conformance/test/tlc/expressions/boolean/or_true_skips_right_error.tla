(*---
description: "TRUE \\/ Q returns TRUE without evaluating Q."
ref: "tlc2/tool/impl/Tool.java#OPCODE_lor"
flags: [expression]
outcome: success
---*)
---- MODULE or_true_skips_right_error ----
EXTENDS Integers
Test == TRUE \/ 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
