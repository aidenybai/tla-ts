(*---
description: permutations applied to interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
