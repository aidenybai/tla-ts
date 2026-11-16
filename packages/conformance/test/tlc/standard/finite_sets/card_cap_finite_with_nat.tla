(*---
description: An intersection with Nat enumerates the finite side.
ref: tlc2/value/impl/SetCapValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_cap_finite_with_nat ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(Nat \cap {1, 2}) = 2 /\ Cardinality({0 - 1, 1} \cap Nat) = 1
====

(*--- recorded
all:
  exit: 0
---*)
