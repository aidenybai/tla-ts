(*---
description: Evaluates a random record expression, seed 262, number 7668.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07668 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((2 < 2) /\ (<<>> = (1 :> 2))) -> IF ([a |-> 1] <=> TRUE) THEN (\A b11802 \in {1, 2} : TRUE) ELSE Cardinality({1}) [] OTHER -> IF (TRUE => FALSE) THEN Tail(<<1, 2>>) ELSE Head(<<3, 1, 2>>), b |-> ((CHOOSE b11803 \in {3 : b11804 \in {}} : (FALSE /\ TRUE)) = ((-2147483647) - Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07668 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 226 to line 14, col 280 of module random_07668
---*)
