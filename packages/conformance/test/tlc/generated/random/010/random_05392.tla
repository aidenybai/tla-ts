(*---
description: Evaluates a random set expression, seed 262, number 5392.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05392 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((-2) .. Cardinality(SUBSET {1})), {b8339 \in {b8340 \in {x \in 1..3 : x > 1} : FALSE} : (\A b8341 \in {x \in 1..3 : x > 1} : FALSE)}} \cup ((CHOOSE b8342 \in (2..1 \cup {2, 1, 3}) : ({1} \subseteq {})) .. ((FALSE => TRUE))[(CHOOSE b8343 \in {1, 2} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05392 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 166 to line 14, col 224 of module random_05392
---*)
