(*---
description: Nat compares unequal with a model value without error.
ref: tlc2/module/Naturals.java#compareTo
features:
  - Naturals
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE nat_compared_with_model_value ----
EXTENDS Naturals
CONSTANT mv
Test == Nat # mv
====

(*--- recorded
all:
  exit: 0
---*)
