(*---
description: negate applied to int_negative, a IntValue.
ref: tlc2/module/Integers.java#Neg
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE negate_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-(-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
