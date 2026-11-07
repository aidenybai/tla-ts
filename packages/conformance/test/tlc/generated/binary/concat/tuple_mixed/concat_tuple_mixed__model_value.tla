(*---
description: concat of tuple_mixed, a TupleValue, and model_value, a ModelValue.
ref: tlc2/module/Sequences.java#Concat
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
---- MODULE concat_tuple_mixed__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((<<1, "a", {TRUE}>>) \o (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    mv
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    mv
---*)
