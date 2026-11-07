(*---
description: power_exponent applied to int_minimum, a IntValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_exponent_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 ^ ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -2147483648
    2169:0 The second argument of ^ should be a natural number, but instead it is:
    -2147483648
---*)
