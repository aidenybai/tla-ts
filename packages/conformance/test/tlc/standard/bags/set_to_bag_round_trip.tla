(*---
description: BagToSet undoes SetToBag.
ref: tlc2/module/Bags.java#SetToBag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE set_to_bag_round_trip ----
EXTENDS Bags, TLC, Naturals
Test == BagToSet(SetToBag({3, 1})) = {1, 3}
====

(*--- recorded
all:
  exit: 0
---*)
