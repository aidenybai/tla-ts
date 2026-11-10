(*---
description: cardinality applied to false, a BoolValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cardinality_false failed.
    2181:0 Attempted to compute cardinality of the value
    FALSE
---*)
