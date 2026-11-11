(*---
description: Evaluates a random function expression, seed 262, number 5406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b8375 == ([b8376 \in 1..3 |-> 0])[([x \in 1..2 |-> x])[7]] IN ([[a |-> 1] EXCEPT !.a = b8375]).a :> CASE (SelectSeq(<<1, 2>>, LAMBDA e : e > 0) = [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 7]) -> (CHOOSE b8377 \in DOMAIN (1 :> 2) : (2 \in 2..1)) [] OTHER -> Cardinality([b8378 \in {} |-> 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05406 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
