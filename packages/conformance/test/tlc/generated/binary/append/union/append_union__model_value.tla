(*---
description: append of union, a UnionValue, and model_value, a ModelValue.
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
---- MODULE append_union__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(Append(UNION {{1}, {2}}, mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {1, 2}
---*)
