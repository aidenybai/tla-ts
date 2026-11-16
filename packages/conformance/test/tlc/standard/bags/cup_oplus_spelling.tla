(*---
description: \oplus is a spelling of (+).
ref: tlc2/module/Bags.java#BagCup
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE cup_oplus_spelling ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) \oplus (1 :> 1) = (1 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
