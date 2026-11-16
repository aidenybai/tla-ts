(*---
description: interval_low applied to int_negative, a IntValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_low_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-3 .. 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| -3..2"
---*)
