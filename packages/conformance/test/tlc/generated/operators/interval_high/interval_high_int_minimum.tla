(*---
description: interval_high applied to int_minimum, a IntValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_high_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 .. (-2147483647 - 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
