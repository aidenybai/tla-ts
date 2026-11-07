(*---
description: "BagToSet does not check that the function is a bag: a zero count still yields its key."
ref: tlc2/module/Bags.java#BagToSet
features:
  - Bags
flags:
  - expression
outcome: success
---*)
---- MODULE bag_to_set_no_validation ----
EXTENDS Bags, TLC, Naturals
Test == BagToSet(1 :> 0) = {1} /\ BagToSet(1 :> "x") = {1}
====

(*--- recorded
all:
  exit: 0
---*)
