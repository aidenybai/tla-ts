(*---
description: 0 and positive integers are in Nat.
ref: tlc2/module/Naturals.java#member
features:
  - Naturals
flags:
  - expression
outcome: success
---*)
---- MODULE nat_member ----
EXTENDS Naturals
Test == 0 \in Nat /\ 1 \in Nat /\ 2147483647 \in Nat
====

(*--- recorded
all:
  exit: 0
---*)
