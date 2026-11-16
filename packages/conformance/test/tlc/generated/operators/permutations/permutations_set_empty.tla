(*---
description: permutations applied to set_empty, a SetEnumValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
