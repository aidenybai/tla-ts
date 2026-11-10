(*---
description: A negative count is not a bag.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_negative_count ----
EXTENDS Bags, TLC, Integers
Test == ~IsABag(1 :> -1)
====

(*--- recorded
all:
  exit: 0
---*)
