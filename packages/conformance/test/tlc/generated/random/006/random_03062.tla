(*---
description: Evaluates a random record expression, seed 262, number 3062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + IF (-Head(<<3, 1, 2>>)) THEN LET b4862 == (3 - 2147483647) IN (-[a |-> 1, b |-> TRUE]) ELSE (((1 :> 2) = 1..3) \/ (SUBSET {1} \subseteq {}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03062 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 45 of module random_03062
---*)
