(*---
description: "Cardinality of SUBSET S is computed from S, so 2^30 elements are counted instantly."
ref: "tlc2/value/impl/SubsetValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE size_without_enumerating ----
EXTENDS Integers, FiniteSets
Test == Cardinality(SUBSET (1..30)) = 1073741824
====

(*--- recorded
all:
  exit: 0
---*)
