(*---
description: concat of function_strings, a FcnRcdValue, and false, a BoolValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_function_strings__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \o (FALSE))
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
