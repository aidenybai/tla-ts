(*---
description: Evaluates a random function expression, seed 262, number 624.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00624 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Head((<<3, 1, 2>> \o <<1>>))) :> IF ((3 < 2147483647) /\ (FALSE <=> FALSE)) THEN LET b1045 == (CHOOSE b1046 \in SUBSET {1} : FALSE) IN (b1045 * 1) ELSE IF (TRUE <=> TRUE) THEN ((1 :> 2))[-1] ELSE (2147483647 - 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00624 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 114 to line 14, col 148 of module random_00624
---*)
