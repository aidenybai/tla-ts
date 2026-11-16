(*---
description: "A lazy filter returned by an operator keeps the parameter it captured."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE filter_returned_from_operator ----
EXTENDS Integers
H(k) == {y \in Nat : y > k}
Test == 1 \in H(0) /\ 1 \notin H(1)
====

(*--- recorded
all:
  exit: 0
---*)
