(*---
description: A non-integer count is not a bag.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_non_int_count ----
EXTENDS Bags, TLC, Naturals
Test == ~IsABag(1 :> "a")
====

(*--- recorded
all:
  exit: 0
---*)
