(*---
description: Evaluates a random bool expression, seed 262, number 49.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00049 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((TRUE /\ TRUE) <=> (0 = 2147483647)) <=> ((~FALSE) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]))) <=> (LET b71 == Len(2) IN ((1 :> 2))[b71] * Cardinality(({1} \cup SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    2
    2283:0 The argument of Len should be a sequence, but instead it is:
    2
---*)
