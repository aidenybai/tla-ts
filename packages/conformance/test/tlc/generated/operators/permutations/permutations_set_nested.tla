(*---
description: permutations applied to set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {({} :> {} @@ {1} :> {1}), ({} :> {1} @@ {1} :> {})}"
---*)
