(*---
description: less_left applied to set_filter, a SetPredValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x \in 1..3 : x > 1} < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    {2, 3}
    2266:0 The first argument of < should be an integer, but instead it is:
    {2, 3}
---*)
