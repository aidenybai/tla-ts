(*---
description: less_left applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1} -> {2, 3}] < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    {<<2>>, <<3>>}
    2266:0 The first argument of < should be an integer, but instead it is:
    {<<2>>, <<3>>}
---*)
