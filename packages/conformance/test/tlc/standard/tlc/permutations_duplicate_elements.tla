(*---
description: The set is normalized first, so a repeated element does not add permutations.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_duplicate_elements ----
EXTENDS TLC, Naturals
Test == Permutations({1, 1}) = {<<1>>}
====

(*--- recorded
all:
  exit: 0
---*)
