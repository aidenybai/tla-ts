(*---
description: power_base applied to int_minimum, a IntValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_base_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-2147483647 - 1) ^ 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -2147483648^2
    2178:0 Overflow when computing -2147483648^2
---*)
