(*---
description: "TRUE \\/ Q returns TRUE without checking that Q is a Boolean."
ref: "tlc2/tool/impl/Tool.java#OPCODE_lor"
flags: [expression]
outcome: success
---*)
---- MODULE or_true_skips_right_non_boolean ----
EXTENDS Integers
Test == TRUE \/ 7
====

(*--- recorded
all:
  exit: 0
---*)
