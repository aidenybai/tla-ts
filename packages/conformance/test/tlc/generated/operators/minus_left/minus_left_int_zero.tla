(*---
description: minus_left applied to int_zero, a IntValue.
ref: tlc2/module/Naturals.java#Minus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE minus_left_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(0 - 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
