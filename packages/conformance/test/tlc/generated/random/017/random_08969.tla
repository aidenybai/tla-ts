(*---
description: Evaluates a random seq expression, seed 262, number 8969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(<<Head(<<1>>), (CHOOSE b13915 \in {1} : FALSE)>>, LAMBDA p, q : p < q), ((CHOOSE b13916 \in [a |-> 3, b |-> TRUE] : (TRUE \/ FALSE)) % (((1 :> 2) @@ [x \in 1..2 |-> x]))[(FALSE + 7)]), (((1 * 3) \div (CHOOSE b13917 \in Nat : FALSE)) + Cardinality({b13918 \in 2..1 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08969 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 47 to line 14, col 75 of module random_08969
---*)
