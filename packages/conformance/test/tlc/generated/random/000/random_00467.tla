(*---
description: Evaluates a random function expression, seed 262, number 467.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00467 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [1..2 -> 2..1] : TRUE) EXCEPT ![([[x \in Nat |-> x + 1] EXCEPT ![0] = 2])[(1 \div TRUE)]] = Cardinality(UNION {{1, 2}, {x \in 1..3 : x > 1}})] @@ [(CHOOSE f \in [{} -> {}] : TRUE) EXCEPT ![IF (<<>> = <<5, 6>>) THEN Len(<<1, 2>>) ELSE {b771 \in {x \in 1..3 : x > 1} : TRUE}] = ([<<5, 6>> EXCEPT ![7] = 2])[([a |-> 1] * <<5, 6>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00467 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 52 of module random_00467
---*)
