(*---
description: is_a_bag applied to model_value, a ModelValue.
ref: tlc2/module/Bags.java#IsABag
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
---- MODULE is_a_bag_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(IsABag(mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
