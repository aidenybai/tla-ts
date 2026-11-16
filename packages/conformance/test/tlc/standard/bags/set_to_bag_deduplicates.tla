(*---
description: "SetToBag normalizes first, the 2012 fix: no multiple copies of an element in the domain."
ref: tlc2/module/Bags.java#SetToBag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE set_to_bag_deduplicates ----
EXTENDS Bags, TLC, Naturals
Test == SetToBag({1, 1}) = (1 :> 1) /\ BagCardinality(SetToBag({1, 1})) = 1
====

(*--- recorded
all:
  exit: 0
---*)
