(*---
description: less_left applied to function, a FcnRcdValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1, 2} |-> x * 2] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    <<2, 4>>
    2266:0 The first argument of < should be an integer, but instead it is:
    <<2, 4>>
---*)
