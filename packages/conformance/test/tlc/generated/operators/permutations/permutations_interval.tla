(*---
description: permutations applied to interval, a IntervalValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2, 3>>, <<1, 3, 2>>, <<2, 1, 3>>, <<2, 3, 1>>, <<3, 1, 2>>, <<3, 2, 1>>}"
---*)
