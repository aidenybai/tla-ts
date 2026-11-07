(*---
description: Evaluates a random seq expression, seed 262, number 8456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b13084 == Head((<<1>> \o [a |-> 1, b |-> TRUE])) IN Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), (IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN LET b13085 == 3 IN [a |-> 1, b |-> TRUE] ELSE (CHOOSE b13086 \in {1} : TRUE) - ((~FALSE) + (1 % 0)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
