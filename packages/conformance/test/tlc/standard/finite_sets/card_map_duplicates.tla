(*---
description: A set map that collapses values counts distinct values.
ref: tlc2/value/impl/SetEnumValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_map_duplicates ----
EXTENDS FiniteSets, Naturals
Test == Cardinality({n * 0 : n \in 1..3}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
