(*---
description: greater_equal_right applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= [x \in {"a", "b"} |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    [a |-> "a", b |-> "b"]
    2266:0 The second argument of >= should be an integer, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
