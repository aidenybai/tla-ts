(*---
description: Compares function_empty, a FcnRcdValue, with model_value, a ModelValue.
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
---- MODULE equals_function_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in {} |-> x]) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
