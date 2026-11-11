(*---
description: "{Any} needs no comparison, so it has one element."
ref: tlc2/module/AnySet.java#compareTo
features:
  - AnySet
flags:
  - expression
outcome: success
---*)
---- MODULE singleton_set_no_compare ----
EXTENDS TLC, FiniteSets
Test == Cardinality({Any}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
