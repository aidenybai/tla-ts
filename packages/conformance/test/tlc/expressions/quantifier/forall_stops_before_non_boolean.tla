(*---
description: "\\A stops at the first counterexample, so a later non-Boolean body value is not seen."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bf"
flags: [expression]
outcome: success
---*)
---- MODULE forall_stops_before_non_boolean ----
EXTENDS Integers
Test == ~\A x \in 1..2 : IF x = 1 THEN FALSE ELSE 7
====

(*--- recorded
all:
  exit: 0
---*)
