(*---
description: Evaluates a random int expression, seed 262, number 1364.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01364 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : 2..1] : TRUE) = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)) % IF (-1 = 0) THEN LET b2177 == 2147483647 IN b2177 ELSE (FALSE /\ TRUE)) + Len(SubSeq(<<2147483647, 2147483647>>, (-2), (CHOOSE r \in [a : 1..2] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01364 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_01364
---*)
