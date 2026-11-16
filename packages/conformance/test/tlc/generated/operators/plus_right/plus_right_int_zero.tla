(*---
description: plus_right applied to int_zero, a IntValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_right_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 + 0)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
