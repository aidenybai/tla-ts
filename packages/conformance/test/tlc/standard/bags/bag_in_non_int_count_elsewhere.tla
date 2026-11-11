(*---
description: A non-integer count at another key is not looked at.
ref: tlc2/module/Bags.java#BagIn
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_in_non_int_count_elsewhere ----
EXTENDS Bags, TLC, Naturals
Test == ~BagIn(2, 1 :> "a")
====

(*--- recorded
all:
  exit: 0
---*)
