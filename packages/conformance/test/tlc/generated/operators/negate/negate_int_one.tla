(*---
description: negate applied to int_one, a IntValue.
ref: tlc2/module/Integers.java#Neg
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE negate_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-(1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
