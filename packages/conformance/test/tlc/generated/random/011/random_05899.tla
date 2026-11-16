(*---
description: Evaluates a random function expression, seed 262, number 5899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail([<<3, 1, 2>> EXCEPT ![1] = 2]), LAMBDA e : e > 0) = (CASE (1 = 3) -> CASE FALSE -> 7 [] OTHER -> 2 [] OTHER -> (CHOOSE b9098 \in 1..3 : FALSE) :> (((1 :> 2) @@ [x \in 1..2 |-> x]))[(<<5, 6>>)[3]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05899 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 144 to line 14, col 172 of module random_05899
---*)
