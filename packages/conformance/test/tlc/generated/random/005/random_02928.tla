(*---
description: Evaluates a random bool expression, seed 262, number 2928.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02928 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b4629 \in ({} \cap 1..3) : (~FALSE)) * ((-2) - LET b4630 == 2147483647 IN 7)) < (CHOOSE b4631 \in (({1} \cup {2, 1, 3}) \cap UNION {{1, 2}, 1..3}) : (\A b4632 \in UNION {{1, 2}, {x \in 1..3 : x > 1}} : (FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02928 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 60 of module random_02928
---*)
