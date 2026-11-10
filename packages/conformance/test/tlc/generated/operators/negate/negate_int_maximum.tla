(*---
description: negate applied to int_maximum, a IntValue.
ref: tlc2/module/Integers.java#Neg
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE negate_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-(2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483647"
---*)
