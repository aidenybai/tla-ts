(*---
description: "FALSE => Q returns TRUE without checking that Q is a Boolean."
ref: "tlc2/tool/impl/Tool.java#OPCODE_implies"
flags: [expression]
outcome: success
---*)
---- MODULE implies_false_skips_right_non_boolean ----
EXTENDS Integers
Test == FALSE => 7
====

(*--- recorded
all:
  exit: 0
---*)
