(*---
description: bag_to_set applied to model_value, a ModelValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE bag_to_set_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(BagToSet(mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module bag_to_set_model_value failed.
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    mv
---*)
