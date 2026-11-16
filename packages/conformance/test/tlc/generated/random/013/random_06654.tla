(*---
description: Evaluates a random function expression, seed 262, number 6654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([[x \in 1..2 |-> x] EXCEPT ![7] = 1] @@ [1 EXCEPT ![7] = 3]) EXCEPT ![((CHOOSE b10207 \in 1..3 : TRUE) + CASE TRUE -> 2 [] OTHER -> 1)] = (({1} \cup {2, 1, 3})).a] @@ [((2147483647 :> 1) @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 2]) EXCEPT ![((2 :> 3))[((1 :> 2))[0]]] = ((-2) - (CHOOSE b10208 \in 1..3 : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 37 of module random_06654
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06654 failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
