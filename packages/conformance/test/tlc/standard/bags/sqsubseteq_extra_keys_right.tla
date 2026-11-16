(*---
description: Extra keys on the right are fine.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_extra_keys_right ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) \sqsubseteq (1 :> 1 @@ 2 :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
