(*---
description: Evaluates a random int expression, seed 262, number 5766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({([b8884 \in {x \in 1..3 : x > 1} |-> 2147483647])[CASE {1} -> b8883 [] OTHER -> b8883] : b8883 \in (Cardinality(SUBSET {1}) .. (2 - 1))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
