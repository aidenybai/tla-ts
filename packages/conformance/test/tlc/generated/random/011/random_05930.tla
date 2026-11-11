(*---
description: Evaluates a random function expression, seed 262, number 5930.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05930 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ <<5, 6>>) @@ [[x \in 1..2 |-> x] EXCEPT ![1] = -1]) @@ ((CHOOSE b9142 \in {} : [a |-> 1]) :> (-3))) @@ ((([a |-> 1]).a :> (2147483647 % 2)) @@ ([[x \in 1..2 |-> x] EXCEPT ![1] = 1] @@ SubSeq(<<>>, 2..1, 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05930 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 99 to line 14, col 129 of module random_05930
---*)
