(*---
description: Evaluates a random int expression, seed 262, number 8909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail((CHOOSE r \in [a : {0} \cup {1}] : TRUE))) * Cardinality((UNION {{1}, {}} \ {-1, 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 0]
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 0]
---*)
