(*---
description: "<=> compares truth values."
ref: "tlc2/tool/impl/Tool.java#OPCODE_equiv"
flags: [expression]
outcome: success
---*)
---- MODULE equiv_same_value ----
EXTENDS Integers
Test == (FALSE <=> FALSE) /\ ~(TRUE <=> FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
