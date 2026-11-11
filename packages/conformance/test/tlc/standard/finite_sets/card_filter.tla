(*---
description: A filter evaluates its predicate for each element.
ref: tlc2/value/impl/SetPredValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_filter ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({n \in 1..5 : n > 2}) = 3
====

(*--- recorded
all:
  exit: 0
---*)
