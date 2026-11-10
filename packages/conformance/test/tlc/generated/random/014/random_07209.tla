(*---
description: Evaluates a random set expression, seed 262, number 7209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(IF (<<3, 1, 2>> = [x \in Nat |-> x + 1]) THEN (1 % 2147483647) ELSE (3 - 2147483647) .. Len(SortSeq(<<>>, LAMBDA p, q : p < q))), (IF (\E b11076 \in 2..1 : TRUE) THEN (CHOOSE b11077 \in SUBSET {1} : FALSE) ELSE Cardinality({}) .. ([(1 :> 2) EXCEPT ![2147483647] = 3])[Head(<<1, 2>>)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07209 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
