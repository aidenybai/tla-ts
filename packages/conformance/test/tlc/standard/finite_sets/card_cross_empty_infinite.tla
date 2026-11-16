(*---
description: An empty component makes the product empty even with a Nat component.
ref: tlc2/value/impl/SetOfTuplesValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_cross_empty_infinite ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({} \X Nat) = 0
====

(*--- recorded
all:
  exit: 0
---*)
