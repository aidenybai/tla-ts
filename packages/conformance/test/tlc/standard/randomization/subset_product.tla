(*---
description: A product works.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_product ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSubset(2, {1, 2} \X {3, 4})) = 2
====

(*--- recorded
all:
  exit: 0
---*)
