(*---
description: "IsABag(3) is FALSE where the TLA+ definition would fail on DOMAIN 3: the Java override returns FALSE for a non-function since 2018."
ref: tlc2/module/Bags.java#IsABag
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE is_a_bag_int ----
EXTENDS Bags, TLC, Naturals
Test == ~IsABag(3)
====

(*--- recorded
all:
  exit: 0
---*)
