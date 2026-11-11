(*---
description: Asks whether model_value is in union, a UnionValue.
ref: tlc2/value/impl/UnionValue.java#member
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
---- MODULE in_union__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \in (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
