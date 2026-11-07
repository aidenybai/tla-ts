(*---
description: More copies is not.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_more ----
EXTENDS Bags, TLC, Naturals
Test == ~((1 :> 3) \sqsubseteq (1 :> 2))
====

(*--- recorded
all:
  exit: 0
---*)
