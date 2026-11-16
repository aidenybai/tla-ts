(*---
description: "Nat answers membership by sign."
ref: "tlc2/module/Naturals.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE nat_member ----
EXTENDS Integers
Test == 0 \in Nat /\ -1 \notin Nat
====

(*--- recorded
all:
  exit: 0
---*)
