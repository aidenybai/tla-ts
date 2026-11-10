(*---
description: "SUBSET membership checks every element of the candidate."
ref: "tlc2/value/impl/SubsetValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_true ----
EXTENDS Integers
Test == {1} \in SUBSET {1, 2} /\ {} \in SUBSET {} /\ {3} \notin SUBSET {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
