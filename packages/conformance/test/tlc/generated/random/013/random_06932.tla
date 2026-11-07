(*---
description: Evaluates a random int expression, seed 262, number 6932.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06932 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ({-1, 2147483647} = {b10612 \in {1} : TRUE}) THEN (IF TRUE THEN -1 ELSE -1 \div ((1 :> 2))[1]) ELSE ((CHOOSE b10613 \in {1, 2} : FALSE) = (<<5, 6>>)[7]) - (((CHOOSE b10614 \in 2..1 : TRUE) + SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) % IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN (-1 .. 0) ELSE Cardinality({2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06932 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 122 to line 14, col 153 of module random_06932
---*)
