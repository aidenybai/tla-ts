(*---
description: negate applied to int_zero, a IntValue.
ref: tlc2/module/Integers.java#Neg
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE negate_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-(0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
