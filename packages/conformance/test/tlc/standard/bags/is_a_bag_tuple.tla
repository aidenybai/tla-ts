(*---
description: A tuple of positive integers is a bag over its indices.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_tuple ----
EXTENDS Bags, TLC, Naturals
Test == IsABag(<<1, 2>>) /\ ~IsABag(<<1, 0>>)
====

(*--- recorded
all:
  exit: 0
---*)
