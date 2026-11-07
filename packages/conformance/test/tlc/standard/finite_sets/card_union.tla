(*---
description: UNION counts overlapping elements once.
ref: tlc2/value/impl/UnionValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_union ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(UNION {{1, 2}, {2, 3}}) = 3 /\ Cardinality(UNION {}) = 0
====

(*--- recorded
all:
  exit: 0
---*)
