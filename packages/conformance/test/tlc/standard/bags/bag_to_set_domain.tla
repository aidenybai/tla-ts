(*---
description: BagToSet is the domain.
ref: tlc2/module/Bags.java#BagToSet
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_to_set_domain ----
EXTENDS Bags, TLC, Naturals
Test == BagToSet("a" :> 2 @@ "b" :> 1) = {"a", "b"}
====

(*--- recorded
all:
  exit: 0
---*)
