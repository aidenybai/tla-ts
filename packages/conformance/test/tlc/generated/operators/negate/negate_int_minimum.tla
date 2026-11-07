(*---
description: negate applied to int_minimum, a IntValue.
ref: tlc2/module/Integers.java#Neg
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE negate_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing --2147483648
    2178:0 Overflow when computing --2147483648
---*)
