(*---
description: Asks whether model_value is in set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
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
---- MODULE in_set_ints__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \in ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
