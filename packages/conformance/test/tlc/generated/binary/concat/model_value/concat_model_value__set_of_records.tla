(*---
description: concat of model_value, a ModelValue, and set_of_records, a SetOfRcdsValue.
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
---- MODULE concat_model_value__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) \o ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    mv
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    mv
---*)
