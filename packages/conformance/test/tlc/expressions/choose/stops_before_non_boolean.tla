(*---
description: "CHOOSE stops at the first satisfying element, so a later non-Boolean predicate value is not seen."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE stops_before_non_boolean ----
EXTENDS Integers
Test == (CHOOSE x \in 1..2 : IF x = 1 THEN TRUE ELSE 7) = 1
====

(*--- recorded
all:
  exit: 0
---*)
