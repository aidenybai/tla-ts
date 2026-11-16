(*---
description: BagIn works on a tuple's indices.
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_in_tuple ----
EXTENDS Bags, TLC, Naturals
Test == BagIn(2, <<1, 1>>) /\ ~BagIn(3, <<1, 1>>)
====

(*--- recorded
all:
  exit: 0
---*)
