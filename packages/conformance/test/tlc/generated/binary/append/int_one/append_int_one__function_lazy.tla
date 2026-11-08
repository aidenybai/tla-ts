(*---
description: append of int_one, a IntValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_int_one__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1, [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module append_int_one__function_lazy failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    1
---*)
