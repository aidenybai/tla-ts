(*---
description: Compares bag, a FcnRcdValue, with model_value, a ModelValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
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
---- MODULE equals_bag__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((SetToBag({1})) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
