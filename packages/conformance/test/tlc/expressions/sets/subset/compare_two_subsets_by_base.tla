(*---
description: "A set of two power sets compares through their base sets."
ref: "tlc2/value/impl/SubsetValue.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE compare_two_subsets_by_base ----
EXTENDS Integers, FiniteSets
Test == Cardinality({SUBSET {1}, SUBSET {1}, SUBSET {2}}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
