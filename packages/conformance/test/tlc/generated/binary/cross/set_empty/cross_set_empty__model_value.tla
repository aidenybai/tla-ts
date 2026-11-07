(*---
description: cross of set_empty, a SetEnumValue, and model_value, a ModelValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
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
---- MODULE cross_set_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({}) \X (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
