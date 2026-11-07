(*---
description: "An interval can be a member candidate of SUBSET."
ref: "tlc2/value/impl/SubsetValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_interval ----
EXTENDS Integers
Test == (1..2) \in SUBSET {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
