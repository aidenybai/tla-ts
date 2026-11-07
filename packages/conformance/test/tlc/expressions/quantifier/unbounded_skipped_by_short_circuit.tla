(*---
description: "An unbounded quantifier is an error only when evaluated."
ref: "tlc2/tool/impl/Tool.java#OPCODE_ue"
flags: [expression]
outcome: success
---*)
---- MODULE unbounded_skipped_by_short_circuit ----
EXTENDS Integers
Test == FALSE => \E x : TRUE
====

(*--- recorded
all:
  exit: 0
---*)
