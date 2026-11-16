(*---
description: "CHOOSE over a large SUBSET finds the empty set without enumerating the power set."
ref: "tlc2/value/impl/SubsetValue.java#elements"
flags: [expression]
outcome: success
---*)
---- MODULE subset_large_not_enumerated ----
EXTENDS Integers
Test == (CHOOSE s \in SUBSET (1..30) : TRUE) = {}
====

(*--- recorded
all:
  exit: 0
---*)
