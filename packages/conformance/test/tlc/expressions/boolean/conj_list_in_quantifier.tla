(*---
description: "A junction list in a quantifier body short-circuits separately for each binding."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cl"
flags: [expression]
outcome: success
---*)
---- MODULE conj_list_in_quantifier ----
EXTENDS Integers
Test == \A x \in {0, 1} :
          \/ x = 0
          \/ 1 \div x = 1
====

(*--- recorded
all:
  exit: 0
---*)
