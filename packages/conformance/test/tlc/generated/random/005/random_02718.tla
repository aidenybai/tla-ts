(*---
description: Evaluates a random int expression, seed 262, number 2718.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02718 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 3, b |-> -1]).a :> (IF FALSE THEN 0 ELSE 7 * (CHOOSE b4295 \in 1..3 : FALSE))))[((((1 :> 2) @@ [x \in 1..2 |-> x]) @@ [b4296 \in {x \in 1..3 : x > 1} |-> b4296]))[((1 % -1) - IF FALSE THEN [x \in 1..2 |-> x] ELSE 1)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02718 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 72 to line 14, col 100 of module random_02718
---*)
