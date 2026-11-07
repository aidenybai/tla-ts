(*---
description: "A finite set can be a subset of Nat."
ref: "tlc2/value/impl/EnumerableValue.java#isSubsetEq"
flags: [expression]
outcome: success
---*)
---- MODULE subseteq_enum_of_nat ----
EXTENDS Integers
Test == {1, 2} \subseteq Nat /\ ~({-1} \subseteq Nat)
====

(*--- recorded
all:
  exit: 0
---*)
