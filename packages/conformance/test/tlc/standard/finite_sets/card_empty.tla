(*---
description: The empty set has cardinality 0 in every representation.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_empty ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({}) = 0 /\ Cardinality(3..1) = 0 /\ Cardinality({n \in 1..3 : FALSE}) = 0
====

(*--- recorded
all:
  exit: 0
---*)
