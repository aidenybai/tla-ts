(*---
description: "CASE guards see the current binding of an enclosing quantifier."
ref: "tlc2/tool/impl/Tool.java#OPCODE_case"
flags: [expression]
outcome: success
---*)
---- MODULE case_in_quantifier_binds_per_element ----
EXTENDS Integers
Test == \A x \in 1..3 : (CASE x = 1 -> 1 [] x = 2 -> 2 [] OTHER -> 3) = x
====

(*--- recorded
all:
  exit: 0
---*)
