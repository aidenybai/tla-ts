(*---
description: "CHOOSE over SUBSET S returns the empty set first."
ref: "tlc2/value/impl/SubsetValue.java#elements"
flags: [expression]
outcome: success
---*)
---- MODULE subset_smallest_first ----
EXTENDS Integers
Test == (CHOOSE s \in SUBSET {3, 1, 2} : TRUE) = {}
====

(*--- recorded
all:
  exit: 0
---*)
