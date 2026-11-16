(*---
description: (+) on tuples adds by index, not concatenation.
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cup_tuples ----
EXTENDS Bags, TLC, Naturals
Test == <<1, 2>> (+) <<3>> = <<4, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
