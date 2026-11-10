(*---
description: BagIn is FALSE for a key with count 0, where the TLA+ definition e \in BagToSet(B) would be TRUE.
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_in_zero_count ----
EXTENDS Bags, TLC, Naturals
Test == ~BagIn(1, 1 :> 0)
====

(*--- recorded
all:
  exit: 0
---*)
