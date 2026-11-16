(*---
description: Compares set_map, a SetEnumValue, with model_value, a ModelValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
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
---- MODULE equals_set_map__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({x + 1 : x \in 1..2}) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
