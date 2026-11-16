(*---
description: An interval's cardinality does not enumerate it.
ref: tlc2/value/impl/IntervalValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_interval ----
EXTENDS FiniteSets, Naturals
Test == Cardinality(1..2000000000) = 2000000000
====

(*--- recorded
all:
  exit: 0
---*)
