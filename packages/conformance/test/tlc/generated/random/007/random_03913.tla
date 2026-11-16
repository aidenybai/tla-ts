(*---
description: Evaluates a random seq expression, seed 262, number 3913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT ![1] = (Head(SubSeq(<<3, 1, 2>>, 7, 2147483647)) + ((1 - 2147483647) * ([a |-> 1, b |-> TRUE] * 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03913 failed.
    Attempted to access record by a non-string argument: 1
---*)
