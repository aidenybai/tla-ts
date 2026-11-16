(*---
description: Permutations({}) has one element, the empty function.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_empty ----
EXTENDS TLC, Naturals
Test == Permutations({}) = {<<>>}
====

(*--- recorded
all:
  exit: 0
---*)
