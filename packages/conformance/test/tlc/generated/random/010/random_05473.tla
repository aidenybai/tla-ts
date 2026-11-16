(*---
description: Evaluates a random seq expression, seed 262, number 5473.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05473 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT ![1] = Cardinality((1..3 \cup {1, 2}))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05473 failed.
    Attempted to access record by a non-string argument: 1
---*)
