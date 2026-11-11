(*---
description: cap of model_value, a ModelValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
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
---- MODULE cap_model_value__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \cap ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
