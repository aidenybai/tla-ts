(*---
description: "The results of a set map stay in enumeration order until normalized, so finding the first needs no compare."
ref: "tlc2/value/impl/ValueVec.java#search"
flags: [expression]
outcome: success
---*)
---- MODULE mixed_results_unnormalized_member ----
EXTENDS Integers
Test == 1 \in {IF x = 1 THEN 1 ELSE "a" : x \in 1..2}
====

(*--- recorded
all:
  exit: 0
---*)
