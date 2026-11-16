(*---
description: "\\cup of Nat and an integer set answers membership across both."
ref: "tlc2/value/impl/SetCupValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE cup_nat_int_set ----
EXTENDS Integers
Test == -1 \in (Nat \cup {-1}) /\ 5 \in (Nat \cup {-1}) /\ -2 \notin (Nat \cup {-1})
====

(*--- recorded
all:
  exit: 0
---*)
