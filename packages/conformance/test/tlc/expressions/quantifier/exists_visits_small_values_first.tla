(*---
description: "\\E visits the normalized order, so an error on a larger element is not reached after a smaller witness."
ref: "tlc2/tool/impl/Tool.java#OPCODE_be"
flags: [expression]
outcome: success
---*)
---- MODULE exists_visits_small_values_first ----
EXTENDS Integers
Test == \E x \in {2, 1} : IF x = 1 THEN TRUE ELSE 1 \div 0 = 0
====

(*--- recorded
all:
  exit: 0
---*)
