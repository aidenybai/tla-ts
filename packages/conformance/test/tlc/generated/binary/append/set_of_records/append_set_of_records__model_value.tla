(*---
description: append of set_of_records, a SetOfRcdsValue, and model_value, a ModelValue.
ref: tlc2/module/Sequences.java#Append
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
---- MODULE append_set_of_records__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append([a : {1, 2}], mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {[a |-> 1], [a |-> 2]}
---*)
