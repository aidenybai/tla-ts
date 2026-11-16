(*---
description: Compares model_value, a ModelValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/ModelValue.java#equals
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
---- MODULE equals_model_value__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
