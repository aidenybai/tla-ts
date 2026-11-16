(*---
description: less_left applied to int_zero, a IntValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(0 < 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
