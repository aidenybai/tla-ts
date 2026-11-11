(*---
description: power_base applied to int_zero, a IntValue.
ref: tlc2/module/Naturals.java#Expt
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE power_base_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(0 ^ 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
