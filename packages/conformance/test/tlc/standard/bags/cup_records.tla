(*---
description: (+) on records adds by field.
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cup_records ----
EXTENDS Bags, TLC, Naturals
Test == [a |-> 1] (+) [a |-> 2, b |-> 1] = [a |-> 3, b |-> 1]
====

(*--- recorded
all:
  exit: 0
---*)
