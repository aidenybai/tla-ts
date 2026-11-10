(*---
description: concat of int_minimum, a IntValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_int_minimum__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \o ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_int_minimum__function_lazy failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    -2147483648
---*)
