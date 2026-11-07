(*---
description: plus_right applied to int_minimum, a IntValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_right_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 + (-2147483647 - 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483647"
---*)
