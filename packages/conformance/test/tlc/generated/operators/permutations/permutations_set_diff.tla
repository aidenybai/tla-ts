(*---
description: permutations applied to set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1>>}"
---*)
