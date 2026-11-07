(*---
description: less_left applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in Nat |-> x] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 31 to line 14, col 31 of module less_left_function_lazy>]
    2266:0 The first argument of < should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 31 to line 14, col 31 of module less_left_function_lazy>]
---*)
