(*---
description: permutations applied to boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#Permutations
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE permutations_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Permutations(BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(FALSE :> FALSE @@ TRUE :> TRUE), (FALSE :> TRUE @@ TRUE :> FALSE)}"
---*)
