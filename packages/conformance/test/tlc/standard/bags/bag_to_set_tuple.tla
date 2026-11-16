(*---
description: BagToSet of a tuple is its index set.
ref: tlc2/module/Bags.java#BagToSet
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_to_set_tuple ----
EXTENDS Bags, TLC, Naturals
Test == BagToSet(<<5, 5>>) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
