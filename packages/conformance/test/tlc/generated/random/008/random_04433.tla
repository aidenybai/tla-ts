(*---
description: Evaluates a random set expression, seed 262, number 4433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE r \in [a : 2..1] : TRUE) = [SUBSET {1} EXCEPT !.a = 3]) -> (Head(<<1>>) + (-0)) [] OTHER -> (((1 :> 2) @@ (1 :> 2)))[((1 :> 2))[2147483647]] .. LET b6976 == (([a |-> 1, b |-> TRUE]).a - ([x \in Nat |-> x + 1])[0]) IN CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> (CHOOSE b6977 \in {x \in 1..3 : x > 1} : FALSE) [] OTHER -> ([x \in Nat |-> x + 1])[b6976]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04433 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 53 of module random_04433
---*)
