(*---
description: The branches recurse into nested set constructors.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE random_nested ----
EXTENDS TLC, Naturals
Test == RandomElement([a : {1} \X [{2} -> {3}]]) = [a |-> <<1, (2 :> 3)>>]
====

(*--- recorded
all:
  exit: 0
---*)
