(*---
description: Two elements have the identity and the swap.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_pair ----
EXTENDS TLC, Naturals
Test == Permutations({1, 2}) = {<<1, 2>>, <<2, 1>>}
====

(*--- recorded
all:
  exit: 0
---*)
