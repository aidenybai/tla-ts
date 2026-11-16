(*---
description: Evaluates a random function expression, seed 262, number 1540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b2445 \in {b2446 \in SUBSET {1} : FALSE} : (\E b2447 \in {1, 2} : TRUE)) :> (LET b2448 == 1 IN b2448 + ([a |-> 1]).a)) @@ [b2449 \in {b2450 \in {b2451 \in 1..3 : TRUE} : (b2450 = b2450)} |-> (((1 :> 2))[-1] - (<<5, 6>>)[3])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01540 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 96 of module random_01540
---*)
