(*---
description: "Normalized integer order is numeric, so a negative is chosen before zero."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE negative_before_zero ----
EXTENDS Integers
Test == (CHOOSE x \in {0, 1, -1} : TRUE) = -1
====

(*--- recorded
all:
  exit: 0
---*)
