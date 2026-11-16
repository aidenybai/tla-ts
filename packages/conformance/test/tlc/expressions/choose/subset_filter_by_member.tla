(*---
description: "CHOOSE over SUBSET S visits subsets by size and then by elements."
ref: "tlc2/value/impl/SubsetValue.java#elements"
flags: [expression]
outcome: success
---*)
---- MODULE subset_filter_by_member ----
EXTENDS Integers
Test == (CHOOSE s \in SUBSET {3, 1, 2} : 3 \in s) = {3}
====

(*--- recorded
all:
  exit: 0
---*)
