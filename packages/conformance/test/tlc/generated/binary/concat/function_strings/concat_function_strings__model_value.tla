(*---
description: concat of function_strings, a FcnRcdValue, and model_value, a ModelValue.
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
---- MODULE concat_function_strings__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(([x \in {"a", "b"} |-> x]) \o (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> "a", b |-> "b"]
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    [a |-> "a", b |-> "b"]
---*)
