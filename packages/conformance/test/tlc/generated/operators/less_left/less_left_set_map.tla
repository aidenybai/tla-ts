(*---
description: less_left applied to set_map, a SetEnumValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x + 1 : x \in 1..2} < 2)
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
