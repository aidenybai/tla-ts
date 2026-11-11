(*---
description: Compares record_nested, a RecordValue, with model_value, a ModelValue.
ref: tlc2/value/impl/RecordValue.java#equals
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
---- MODULE equals_record_nested__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([a |-> [b |-> <<1>>]]) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
