(*---
description: Evaluates a random set expression, seed 262, number 2613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{1} -> {}] : TRUE) \cap ((({2, 1, 3} \cup {1}) \cup {b4115 : b4115 \in {x \in 1..3 : x > 1}}) \ (UNION {{x \in 1..3 : x > 1}, 1..3} \ DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02613 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 55 of module random_02613
---*)
