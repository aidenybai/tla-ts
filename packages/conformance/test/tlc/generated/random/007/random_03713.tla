(*---
description: Evaluates a random int expression, seed 262, number 3713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE b5868 \in 2..1 : FALSE) = Head(TRUE)) -> ((CHOOSE f \in [{1} -> {}] : TRUE))[(3 - 1)] [] OTHER -> IF (TRUE \/ FALSE) THEN ([a |-> 1, b |-> TRUE] \div 7) ELSE (<<5, 6>>)[-1] + Head(SubSeq(Append(<<>>, -1), LET b5869 == 3 IN b5869, Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03713 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 52 of module random_03713
---*)
