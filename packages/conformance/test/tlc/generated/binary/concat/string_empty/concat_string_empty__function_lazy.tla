(*---
description: concat of string_empty, a StringValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \o ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_string_empty__function_lazy failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module concat_string_empty__function_lazy>]
---*)
