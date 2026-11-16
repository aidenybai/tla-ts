(*---
description: is_finite_set applied to interval, a IntervalValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
