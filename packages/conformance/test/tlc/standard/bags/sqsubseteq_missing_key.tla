(*---
description: A key absent from the right is not a subbag.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_missing_key ----
EXTENDS Bags, TLC, Naturals
Test == ~((1 :> 1) \sqsubseteq (2 :> 1))
====

(*--- recorded
all:
  exit: 0
---*)
