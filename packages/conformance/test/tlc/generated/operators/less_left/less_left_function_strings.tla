(*---
description: less_left applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {"a", "b"} |-> x] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> "a", b |-> "b"]
    2266:0 The first argument of < should be an integer, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
