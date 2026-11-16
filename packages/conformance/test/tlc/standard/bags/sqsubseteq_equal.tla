(*---
description: A bag is a subbag of itself.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_equal ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 2) \sqsubseteq (1 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
