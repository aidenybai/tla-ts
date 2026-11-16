(*---
description: "Duplicates collapse when two elements are equal in different representations."
ref: "tlc2/value/impl/SetEnumValue.java#normalize"
flags: [expression]
outcome: success
---*)
---- MODULE duplicates_across_representations ----
EXTENDS Integers, FiniteSets, TLC
Test == Cardinality({<<1, 2>>, [i \in 1..2 |-> i], (1 :> 1 @@ 2 :> 2)}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
