(*---
description: "CHOOSE over SUBSET S visits same-size subsets by their elements."
ref: "tlc2/value/impl/SubsetValue.java#elements"
flags: [expression]
outcome: success
---*)
---- MODULE subset_same_size_lexicographic ----
EXTENDS Integers, FiniteSets
Test == (CHOOSE s \in SUBSET (1..4) : Cardinality(s) = 2) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
