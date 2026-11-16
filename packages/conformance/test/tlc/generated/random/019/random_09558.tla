(*---
description: Evaluates a random int expression, seed 262, number 9558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({LET b14844 == (7 + 3) IN Cardinality(SUBSET {1}) : b14843 \in ((2147483647 + -1) .. (0 % 3))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
