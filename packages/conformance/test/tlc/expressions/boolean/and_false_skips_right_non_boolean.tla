(*---
description: "FALSE /\\ Q returns FALSE without checking that Q is a Boolean."
ref: "tlc2/tool/impl/Tool.java#OPCODE_land"
flags: [expression]
outcome: success
---*)
---- MODULE and_false_skips_right_non_boolean ----
EXTENDS Integers
Test == (FALSE /\ 7) = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
