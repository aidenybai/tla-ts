(*---
description: "CHOOSE over a large SUBSET reaches singletons without enumerating every subset."
ref: "tlc2/value/impl/SubsetValue.java#elements"
flags: [expression]
outcome: success
---*)
---- MODULE subset_large_singleton ----
EXTENDS Integers
Test == (CHOOSE s \in SUBSET (1..30) : s # {}) = {1}
====

(*--- recorded
all:
  exit: 0
---*)
