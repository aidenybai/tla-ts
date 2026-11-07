(*---
description: Evaluates a random bool expression, seed 262, number 7870.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07870 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SortSeq((CHOOSE r \in [a : {2, 1, 3}] : TRUE), LAMBDA p, q : p < q) \o [SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = (CHOOSE b12152 \in {1} : TRUE)]) = Append(Append(SubSeq(<<3, 1, 2>>, 7, 3), LET b12153 == -1 IN -1), ((1..3 + 3) % (<<5, 6>>)[7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    [a |-> 1]
---*)
