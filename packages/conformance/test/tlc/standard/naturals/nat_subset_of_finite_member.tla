(*---
description: A finite set can be tested for inclusion in Nat.
ref: tlc2/module/Naturals.java#member
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_subset_of_finite_member ----
EXTENDS Naturals
Test == {0, 1} \subseteq Nat /\ ~({0 - 1} \subseteq Nat)
====

(*--- recorded
all:
  exit: 0
---*)
