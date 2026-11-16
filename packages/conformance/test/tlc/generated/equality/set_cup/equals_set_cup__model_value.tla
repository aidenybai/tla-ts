(*---
description: Compares set_cup, a SetCupValue, with model_value, a ModelValue.
ref: tlc2/value/impl/SetCupValue.java#equals
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
---- MODULE equals_set_cup__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({1} \cup {2}) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
