(*---
description: interval_high applied to int_negative, a IntValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_high_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 .. -3)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
