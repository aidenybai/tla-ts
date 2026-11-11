(*---
description: "Nat \\ S stays lazy and answers membership from both sides."
ref: "tlc2/value/impl/SetDiffValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE diff_lazy_member ----
EXTENDS Integers
Test == 0 \in (Nat \ {1}) /\ 1 \notin (Nat \ {1}) /\ -1 \notin (Nat \ {1})
====

(*--- recorded
all:
  exit: 0
---*)
