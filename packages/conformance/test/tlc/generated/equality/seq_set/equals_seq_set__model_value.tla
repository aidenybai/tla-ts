(*---
description: Compares seq_set, a UserValue, with model_value, a ModelValue.
ref: tlc2/value/impl/UserValue.java#equals
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
---- MODULE equals_seq_set__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((Seq({1})) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
