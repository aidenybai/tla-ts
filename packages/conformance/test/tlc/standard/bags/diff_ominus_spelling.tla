(*---
description: \ominus is a spelling of (-).
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE diff_ominus_spelling ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 2) \ominus (1 :> 1) = (1 :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
