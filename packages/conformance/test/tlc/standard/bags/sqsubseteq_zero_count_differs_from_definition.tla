(*---
description: (1 :> 0) \sqsubseteq EmptyBag is TRUE in Java, where the TLA+ definition requires the domain to be included and says FALSE.
ref: tlc2/module/Bags.java#SqSubseteq
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE sqsubseteq_zero_count_differs_from_definition ----
EXTENDS Bags, TLC, Naturals
Test == (1 :> 0) \sqsubseteq EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
