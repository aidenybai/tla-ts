(*---
description: A function into positive integers is a bag.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_positive_counts ----
EXTENDS Bags, TLC, Naturals
Test == IsABag(1 :> 1) /\ IsABag("a" :> 2 @@ "b" :> 3)
====

(*--- recorded
all:
  exit: 0
---*)
