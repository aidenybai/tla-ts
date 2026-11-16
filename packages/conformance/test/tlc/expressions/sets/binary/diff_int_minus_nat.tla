(*---
description: "Int \\ Nat answers membership for negatives."
ref: "tlc2/value/impl/SetDiffValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE diff_int_minus_nat ----
EXTENDS Integers
Test == -1 \in (Int \ Nat) /\ 1 \notin (Int \ Nat)
====

(*--- recorded
all:
  exit: 0
---*)
