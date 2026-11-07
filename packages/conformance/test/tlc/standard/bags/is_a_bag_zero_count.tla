(*---
description: A zero count is not a bag.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_zero_count ----
EXTENDS Bags, TLC, Naturals
Test == ~IsABag(1 :> 0)
====

(*--- recorded
all:
  exit: 0
---*)
