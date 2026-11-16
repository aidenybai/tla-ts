(*---
description: "= on Booleans agrees with <=>."
ref: "tlc2/tool/impl/Tool.java#OPCODE_eq"
flags: [expression]
outcome: success
---*)
---- MODULE equality_of_booleans_is_equiv ----
EXTENDS Integers
Test == \A p, q \in BOOLEAN : (p = q) = (p <=> q)
====

(*--- recorded
all:
  exit: 0
---*)
