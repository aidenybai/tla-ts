(*---
description: "A product with an empty component has size 0 even when another component is infinite."
ref: "tlc2/value/impl/SetOfTuplesValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE empty_component_size_with_nat ----
EXTENDS Integers, FiniteSets
Test == Cardinality({} \X Nat) = 0
====

(*--- recorded
all:
  exit: 0
---*)
