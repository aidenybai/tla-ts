(*---
description: permutations applied to union, a UnionValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 2>>, <<2, 1>>}"
---*)
