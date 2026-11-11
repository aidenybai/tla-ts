(*---
description: Evaluates a random int expression, seed 262, number 9727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b15094 \in {b15095 \in UNION {({2, 1, 3} \cup {1, 2}), DOMAIN (1 :> 2)} : ((1..3 \cup {1, 2}) = {b15096 \in {1} : TRUE})} : (((TRUE /\ TRUE) => (<<5, 6>> < b15094)) \/ ((b15094 - b15094) < Cardinality(SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09727 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 237 of module random_09727
---*)
