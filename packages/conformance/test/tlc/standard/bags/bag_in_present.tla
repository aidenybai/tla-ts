(*---
description: BagIn holds for a key with a positive count.
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_in_present ----
EXTENDS Bags, TLC, Naturals
Test == BagIn(1, 1 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
