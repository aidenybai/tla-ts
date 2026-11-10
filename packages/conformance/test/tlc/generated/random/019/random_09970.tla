(*---
description: Evaluates a random int expression, seed 262, number 9970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b15501 == (Cardinality({}) * (CHOOSE b15502 \in {} : TRUE)) IN (CHOOSE b15503 \in ({1, 2} \cap Nat) : (<<1>> = [x \in Nat |-> x + 1])) + Len(Append(SortSeq(<<>>, LAMBDA p, q : p < q), Cardinality(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09970 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
