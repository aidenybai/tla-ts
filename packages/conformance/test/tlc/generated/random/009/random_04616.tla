(*---
description: Evaluates a random seq expression, seed 262, number 4616.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04616 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(<<Head(<<1>>), Cardinality({2, 1, 3})>>, IF (2147483647 = 7) THEN Len(<<1>>) ELSE (CHOOSE b7227 \in FALSE : FALSE), (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE)), (IF (2 < <<5, 6>>) THEN IF FALSE THEN 2147483647 ELSE -1 ELSE Cardinality({}) :> Len(<<7, 0>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04616 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 113 to line 14, col 142 of module random_04616
---*)
