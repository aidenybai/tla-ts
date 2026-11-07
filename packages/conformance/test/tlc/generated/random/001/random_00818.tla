(*---
description: Evaluates a random seq expression, seed 262, number 818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = LET b1340 == 3 IN -1] EXCEPT ![1] = IF (<<3, 1, 2>> = [x \in Nat |-> x + 1]) THEN (CHOOSE b1341 \in Nat : FALSE) ELSE UNION {2..1, SUBSET {1}}] EXCEPT ![1] = (Head(SubSeq(<<3, 1, 2>>, -1, 2)) * Head(<<1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00818 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
