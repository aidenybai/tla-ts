(*---
description: "FALSE /\\ Q returns FALSE without evaluating Q, so a division by zero in Q is never reported."
ref: "tlc2/tool/impl/Tool.java#OPCODE_land"
flags: [expression]
outcome: success
---*)
---- MODULE and_false_skips_right_error ----
EXTENDS Integers
Test == (FALSE /\ 1 \div 0 = 0) = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
