(*---
description: mod_divisor applied to int_minimum, a IntValue.
ref: tlc2/module/Naturals.java#Mod
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE mod_divisor_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(7 % ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module mod_divisor_int_minimum failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2147483648
---*)
