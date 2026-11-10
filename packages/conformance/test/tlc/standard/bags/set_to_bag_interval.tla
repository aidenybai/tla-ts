(*---
description: SetToBag converts an interval through toSetEnum.
ref: tlc2/module/Bags.java#SetToBag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE set_to_bag_interval ----
EXTENDS Bags, TLC, Naturals
Test == SetToBag(1..3) = <<1, 1, 1>>
====

(*--- recorded
all:
  exit: 0
---*)
