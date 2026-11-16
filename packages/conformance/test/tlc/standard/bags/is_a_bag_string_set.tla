(*---
description: A string or a set is simply not a bag.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_string_set ----
EXTENDS Bags, TLC, Naturals
Test == ~IsABag("abc") /\ ~IsABag({})
====

(*--- recorded
all:
  exit: 0
---*)
