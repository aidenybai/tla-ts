(*---
description: cardinality applied to seq_set, a UserValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cardinality_seq_set failed.
    2181:0 Attempted to compute cardinality of the value
    Seq({1})
---*)
