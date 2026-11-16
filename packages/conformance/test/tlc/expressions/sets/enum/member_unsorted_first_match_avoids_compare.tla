(*---
description: "Membership in an unnormalized set scans in source order, so a match on the first element never compares against the later string."
ref: "tlc2/value/impl/ValueVec.java#search"
flags: [expression]
outcome: success
---*)
---- MODULE member_unsorted_first_match_avoids_compare ----
EXTENDS Integers
Test == 1 \in {1, "a"}
====

(*--- recorded
all:
  exit: 0
---*)
