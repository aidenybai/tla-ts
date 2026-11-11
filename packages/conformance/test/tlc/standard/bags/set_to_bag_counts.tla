(*---
description: SetToBag gives every element one copy.
ref: tlc2/module/Bags.java#SetToBag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE set_to_bag_counts ----
EXTENDS Bags, TLC, Naturals
Test == SetToBag({"a"}) = ("a" :> 1) /\ SetToBag({}) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
