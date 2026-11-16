(*---
description: Distinct model values count separately, and equal ones once.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - FiniteSets
flags:
  - expression
outcome: success
config: |
  CONSTANT a = a
  CONSTANT b = b
---*)
---- MODULE card_model_values ----
EXTENDS FiniteSets, Naturals
CONSTANT a, b
Test == Cardinality({a, b, a}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
