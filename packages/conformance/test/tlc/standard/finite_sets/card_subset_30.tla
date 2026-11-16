(*---
description: SUBSET of a 30-element set fits, without enumerating.
ref: tlc2/value/impl/SubsetValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_subset_30 ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(SUBSET (1..30)) = 1073741824
====

(*--- recorded
all:
  exit: 0
---*)
