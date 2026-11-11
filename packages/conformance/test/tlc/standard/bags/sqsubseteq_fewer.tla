(*---
description: Fewer copies is a subbag.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_fewer ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 1) \sqsubseteq (1 :> 2)
====

(*--- recorded
all:
  exit: 0
---*)
