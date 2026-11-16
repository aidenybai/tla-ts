(*---
description: BagOfAll of the empty bag is empty.
ref: tlc2/module/Bags.java#BagOfAll
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_of_all_empty ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x, EmptyBag) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
