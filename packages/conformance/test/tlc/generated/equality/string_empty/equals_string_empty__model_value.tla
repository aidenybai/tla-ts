(*---
description: Compares string_empty, a StringValue, with model_value, a ModelValue.
ref: tlc2/value/impl/StringValue.java#equals
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
---- MODULE equals_string_empty__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(("") = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
