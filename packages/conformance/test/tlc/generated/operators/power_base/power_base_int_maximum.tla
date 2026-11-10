(*---
description: power_base applied to int_maximum, a IntValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_base_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2147483647 ^ 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module power_base_int_maximum failed.
    2178:0 Overflow when computing 2147483647^2
---*)
