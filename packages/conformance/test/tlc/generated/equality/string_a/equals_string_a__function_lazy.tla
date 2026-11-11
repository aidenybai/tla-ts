(*---
description: Compares string_a, a StringValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/StringValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_a__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_a__function_lazy failed.
    Attempted to check equality of string "a" with non-string:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module equals_string_a__function_lazy>]
---*)
