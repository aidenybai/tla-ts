(*---
description: "FALSE precedes TRUE in normalized order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE false_before_true ----
EXTENDS Integers
Test == (CHOOSE x \in {TRUE, FALSE} : TRUE) = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
