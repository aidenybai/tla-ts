(*---
description: Compares set_of_functions, a SetOfFcnsValue, with model_value, a ModelValue.
ref: tlc2/value/impl/SetOfFcnsValue.java#equals
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
---- MODULE equals_set_of_functions__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([{1} -> {2, 3}]) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
