(*---
description: The empty bag and the empty tuple are bags.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_empty ----
EXTENDS Bags, TLC, Naturals
Test == IsABag(EmptyBag) /\ IsABag(<<>>)
====

(*--- recorded
all:
  exit: 0
---*)
