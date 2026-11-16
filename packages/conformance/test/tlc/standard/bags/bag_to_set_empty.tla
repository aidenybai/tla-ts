(*---
description: BagToSet of the empty bag is empty.
ref: tlc2/module/Bags.java#BagToSet
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_to_set_empty ----
EXTENDS Bags, TLC, Naturals
Test == BagToSet(EmptyBag) = {}
====

(*--- recorded
all:
  exit: 0
---*)
