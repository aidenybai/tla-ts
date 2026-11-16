(*---
description: BagUnion of a filter over bags enumerates it.
ref: tlc2/module/Bags.java#BagUnion
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE union_interval_of_bags ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({b \in {1 :> 1, 1 :> 2} : TRUE}) = (1 :> 3)
====

(*--- recorded
all:
  exit: 0
---*)
