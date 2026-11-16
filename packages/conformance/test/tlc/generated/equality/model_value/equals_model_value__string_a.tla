(*---
description: Compares model_value, a ModelValue, with string_a, a StringValue.
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
---- MODULE equals_model_value__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
