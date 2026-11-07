(*---
description: plus_left applied to int_negative, a IntValue.
ref: tlc2/module/Naturals.java#Plus
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE plus_left_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-3 + 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
