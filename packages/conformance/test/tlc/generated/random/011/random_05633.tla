(*---
description: Evaluates a random bool expression, seed 262, number 5633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> Cardinality({}) [] OTHER -> IF FALSE THEN 0 ELSE 1] = [a |-> Len(Tail(<<1, 2>>)), b |-> (({1} \cup 2..1) = ({x \in 1..3 : x > 1} \cap SUBSET {1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05633 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 46 of module random_05633
---*)
