(*---
description: Evaluates a random seq expression, seed 262, number 1848.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01848 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(<<(CHOOSE b2919 \in {x \in 1..3 : x > 1} : FALSE), (7 \div 1)>>, (([a |-> 1, b |-> TRUE]).a \div Len(<<1, 2>>)), IF (FALSE < 1) THEN Len(<<1>>) ELSE (1 % 2)), IF (({2, 1, 3} \subseteq {1}) => ({} \subseteq FALSE)) THEN Cardinality(UNION {1, {}}) ELSE Len([<<>> EXCEPT ![1] = 0]), (LET b2920 == Head(<<>>) IN ([a |-> 1]).a \div ((CHOOSE b2921 \in {1, 2} : FALSE) + CASE FALSE -> -1 [] OTHER -> 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01848 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 77 of module random_01848
---*)
