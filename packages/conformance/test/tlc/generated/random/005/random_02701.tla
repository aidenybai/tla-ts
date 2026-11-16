(*---
description: Evaluates a random bool expression, seed 262, number 2701.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02701 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE) @@ (CHOOSE f \in [{1, 2} -> 1..2] : TRUE)) = {(CHOOSE b4271 \in (7 .. b4270) : (FALSE <=> FALSE)) : b4270 \in {(-0), (CHOOSE b4272 \in {x \in 1..3 : x > 1} : FALSE)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02701 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 193 to line 14, col 237 of module random_02701
---*)
