(*---
description: "A normalized domain of at least 32 elements uses binary search and finds each key."
ref: "tlc2/value/impl/FcnRcdValue.java#selectBinarySearch"
flags: [expression]
outcome: success
---*)
---- MODULE long_domain_binary_search_finds ----
EXTENDS Integers
F == [x \in {y * 2 : y \in 1..40} |-> x + 1]
Test == F[2] = 3 /\ F[80] = 81 /\ F[42] = 43
====

(*--- recorded
all:
  exit: 0
---*)
