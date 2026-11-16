(*---
description: "Membership in a set that was normalized by a definition uses binary search and finds the value."
ref: "tlc2/value/impl/ValueVec.java#search"
flags: [expression]
outcome: success
---*)
---- MODULE member_normalized_uses_compare ----
EXTENDS Integers
S == {3, 1, 2}
Test == 2 \in S /\ 4 \notin S
====

(*--- recorded
all:
  exit: 0
---*)
