(*---
description: The empty bag is a subbag of everything.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_empty ----
EXTENDS Bags, TLC, Naturals
Test == EmptyBag \sqsubseteq (1 :> 1) /\ EmptyBag \sqsubseteq EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
