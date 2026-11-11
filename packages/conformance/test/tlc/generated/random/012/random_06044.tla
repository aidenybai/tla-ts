(*---
description: Evaluates a random set expression, seed 262, number 6044.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06044 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq([(1 :> 2) EXCEPT ![1] = 1], LAMBDA p, q : p < q)) .. (LET b9308 == IF TRUE THEN 0 ELSE 7 IN (CHOOSE b9309 \in 2..1 : TRUE) + ((CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE))[LET b9310 == 7 IN 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06044 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 123 to line 14, col 150 of module random_06044
---*)
