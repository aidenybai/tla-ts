(*---
description: greater_equal_right applied to int_maximum, a IntValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= 2147483647)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
