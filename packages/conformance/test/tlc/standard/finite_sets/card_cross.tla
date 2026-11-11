(*---
description: A product has the product of its component cardinalities.
ref: tlc2/value/impl/SetOfTuplesValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_cross ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({1, 2} \X {1, 2, 3}) = 6 /\ Cardinality({} \X {1}) = 0
====

(*--- recorded
all:
  exit: 0
---*)
