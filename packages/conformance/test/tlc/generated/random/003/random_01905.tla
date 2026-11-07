(*---
description: Evaluates a random bool expression, seed 262, number 1905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = [(Append(<<3, 1, 2>>, 3) = (Nat @@ (1 :> 2))) EXCEPT !.a = (([x \in 1..2 |-> x])[2147483647] % Len(TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    Nat
    2169:0 The first argument of @@ should be a function, but instead it is:
    Nat
---*)
