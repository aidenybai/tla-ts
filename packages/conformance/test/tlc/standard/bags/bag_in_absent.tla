(*---
description: BagIn is FALSE for a key not in the domain.
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_in_absent ----
EXTENDS Bags, TLC, Naturals
Test == ~BagIn(2, 1 :> 2) /\ ~BagIn(1, EmptyBag)
====

(*--- recorded
all:
  exit: 0
---*)
