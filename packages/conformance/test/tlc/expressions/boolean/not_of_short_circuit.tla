(*---
description: "~ applies to the result of a short-circuited operand."
ref: "tlc2/tool/impl/Tool.java#OPCODE_lnot"
flags: [expression]
outcome: success
---*)
---- MODULE not_of_short_circuit ----
EXTENDS Integers
Test == ~(FALSE /\ 7)
====

(*--- recorded
all:
  exit: 0
---*)
