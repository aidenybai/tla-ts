(*---
description: "CHOOSE returns the first element in normalized order that satisfies the predicate."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE filter_then_first ----
EXTENDS Integers
Test == (CHOOSE x \in {3, 1, 2} : x > 1) = 2
====

(*--- recorded
all:
  exit: 0
---*)
