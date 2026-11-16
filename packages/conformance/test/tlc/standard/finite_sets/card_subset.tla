(*---
description: SUBSET has 2^n elements.
ref: tlc2/value/impl/SubsetValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_subset ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(SUBSET {1, 2, 3}) = 8 /\ Cardinality(SUBSET {}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
