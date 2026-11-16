(*---
description: permutations applied to set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>, <<2, 1>>}"
---*)
