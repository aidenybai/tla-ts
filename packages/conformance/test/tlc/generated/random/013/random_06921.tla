(*---
description: Evaluates a random bool expression, seed 262, number 6921.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06921 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a .. (CHOOSE b10592 \in {1, 2} : FALSE)) \cup UNION {DOMAIN <<5, 6>>, ({} \cap {x \in 1..3 : x > 1})}) = UNION {DOMAIN [b10593 \in TRUE |-> 3], (DOMAIN <<5, 6>> \cup (2147483647 .. 2147483647))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06921 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 49 to line 14, col 80 of module random_06921
---*)
