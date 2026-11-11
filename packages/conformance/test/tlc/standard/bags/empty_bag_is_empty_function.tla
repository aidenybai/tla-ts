(*---
description: EmptyBag is the empty function, equal to <<>>.
ref: tlc2/module/Bags.java#EmptyBag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE empty_bag_is_empty_function ----
EXTENDS Bags, TLC, Naturals
Test == EmptyBag = <<>> /\ DOMAIN EmptyBag = {}
====

(*--- recorded
all:
  exit: 0
---*)
