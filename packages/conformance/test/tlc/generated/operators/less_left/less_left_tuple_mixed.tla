(*---
description: less_left applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1, "a", {TRUE}>> < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    <<1, "a", {TRUE}>>
    2266:0 The first argument of < should be an integer, but instead it is:
    <<1, "a", {TRUE}>>
---*)
