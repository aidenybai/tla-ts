(*---
description: "A nested CHOOSE picks a witness first and uses it in the outer predicate."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE nested_choose ----
EXTENDS Integers
Test == (CHOOSE x \in 1..3 : x > (CHOOSE y \in 1..3 : y > 1)) = 3
====

(*--- recorded
all:
  exit: 0
---*)
