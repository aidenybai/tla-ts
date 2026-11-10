(*---
description: Evaluates a random set expression, seed 262, number 6683.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06683 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1}) .. (CHOOSE b10244 \in <<5, 6>> : TRUE)) \cup {b10245 \in UNION {{x \in 1..3 : x > 1}, {}} : (\E b10246 \in {x \in 1..3 : x > 1} : TRUE)}) \ ((Cardinality({}) + (CHOOSE b10247 \in {2, 1, 3} : TRUE)) .. Cardinality({b10248 \in {1, 2} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06683 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 40 to line 14, col 72 of module random_06683
---*)
