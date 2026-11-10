(*---
description: Every member satisfies \sqsubseteq.
ref: tla2sany/StandardModules/Bags.tla
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE subbag_members_are_subbags ----
EXTENDS Bags, TLC, Naturals
Test == \A b \in SubBag("a" :> 2 @@ "b" :> 1) : b \sqsubseteq ("a" :> 2 @@ "b" :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
