(*---
description: Permutations of model values are the symmetry sets of a model.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT a = a
  CONSTANT b = b
---*)
---- MODULE permutations_model_values ----
EXTENDS TLC, Naturals, FiniteSets
CONSTANT a, b
Test == Cardinality(Permutations({a, b})) = 2
====

(*--- recorded
all:
  exit: 0
---*)
