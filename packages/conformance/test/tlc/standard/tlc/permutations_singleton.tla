(*---
description: One element has one permutation.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_singleton ----
EXTENDS TLC, Naturals
Test == Permutations({"a"}) = {"a" :> "a"}
====

(*--- recorded
all:
  exit: 0
---*)
