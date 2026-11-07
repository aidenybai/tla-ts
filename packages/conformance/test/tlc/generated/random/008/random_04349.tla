(*---
description: Evaluates a random bool expression, seed 262, number 4349.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04349 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1}] : TRUE) = [a |-> Cardinality(UNION {SUBSET {1}, {}}), b |-> (<<3, 7>> = (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
