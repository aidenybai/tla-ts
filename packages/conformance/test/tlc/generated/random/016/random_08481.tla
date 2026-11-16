(*---
description: Evaluates a random set expression, seed 262, number 8481.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08481 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (CHOOSE b13129 \in SUBSET {1} : FALSE), b |-> (FALSE => TRUE)]).a \ UNION {{(CHOOSE b13131 \in {1, 2} : FALSE) : b13130 \in (<<3, 1, 2>> .. -1)}, (DOMAIN [x \in Nat |-> x + 1] \ (7 .. -1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08481 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 61 of module random_08481
---*)
