(*---
description: BagOfAll maps keys and keeps counts.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_of_all_map ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x + 1, 1 :> 2) = (2 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
