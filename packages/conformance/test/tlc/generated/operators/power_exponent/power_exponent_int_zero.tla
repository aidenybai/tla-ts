(*---
description: power_exponent applied to int_zero, a IntValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_exponent_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 ^ (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
