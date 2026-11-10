(*---
description: A record of positive integers is a bag over its field names.
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_record ----
EXTENDS Bags, TLC, Naturals
Test == IsABag([a |-> 1]) /\ ~IsABag([a |-> 0])
====

(*--- recorded
all:
  exit: 0
---*)
