(*---
description: "TLC does not look at the predicate text, so two predicates with the same witness return it."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE predicate_equivalence_does_not_matter_to_syntax ----
EXTENDS Integers
Test == (CHOOSE x \in 1..3 : x = 2) = (CHOOSE x \in 1..3 : x + 1 = 3)
====

(*--- recorded
all:
  exit: 0
---*)
