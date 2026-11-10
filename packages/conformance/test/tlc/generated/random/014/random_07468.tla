(*---
description: Evaluates a random bool expression, seed 262, number 7468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE))[(-(CHOOSE b11509 \in SUBSET {1} : FALSE))] \in {b11510 \in UNION {{b11511 \in 2..1 : TRUE}, (SUBSET {1} \cap {1, 2})} : (\E b11512 \in DOMAIN <<5, 6>> : (TRUE <=> TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07468 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 64 to line 14, col 99 of module random_07468
---*)
