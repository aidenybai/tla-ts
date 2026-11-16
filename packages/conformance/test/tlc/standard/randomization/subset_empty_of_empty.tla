(*---
description: k = 0 of the empty set is empty.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_empty_of_empty ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(0, {}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
