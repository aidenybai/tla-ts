(*---
description: Evaluates a random seq expression, seed 262, number 1831.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01831 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<LET b2900 == Cardinality(({1} \cap SUBSET {1})) IN IF (2..1 = {2, 1, 3}) THEN (b2900 - b2900) ELSE (CHOOSE b2901 \in SUBSET {1} : FALSE), (IF (TRUE /\ FALSE) THEN (<<5, 6>>)[-1] ELSE (2 - 2147483647) :> LET b2902 == [a |-> -1, b |-> TRUE] IN (b2902 - b2902))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01831 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 118 to line 14, col 152 of module random_01831
---*)
