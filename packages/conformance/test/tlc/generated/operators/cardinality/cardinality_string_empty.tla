(*---
description: cardinality applied to string_empty, a StringValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(""))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cardinality_string_empty failed.
    2181:0 Attempted to compute cardinality of the value
    ""
---*)
