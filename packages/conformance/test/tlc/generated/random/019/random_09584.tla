(*---
description: Evaluates a random int expression, seed 262, number 9584.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09584 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(<<3, [x \in 1..2 |-> x]>>, LET b14883 == 3 IN <<1, 2>>, (CHOOSE b14884 \in {x \in 1..3 : x > 1} : FALSE))) % ((CHOOSE b14885 \in UNION {<<3, 1, 2>>, {x \in 1..3 : x > 1}} : (FALSE \/ FALSE)) * Cardinality((1 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09584 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 85 to line 14, col 130 of module random_09584
---*)
