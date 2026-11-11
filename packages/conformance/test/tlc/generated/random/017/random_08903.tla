(*---
description: Evaluates a random function expression, seed 262, number 8903.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08903 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b13790 \in (([a |-> 1, b |-> TRUE]).a .. (CHOOSE b13791 \in 1..3 : FALSE)) |-> ((3 :> 7) % CASE TRUE -> Nat [] OTHER -> b13790)] EXCEPT ![((LET b13792 == 7 IN b13792 :> CASE FALSE -> 1 [] OTHER -> 1))[((<<5, 6>>)[-1] % (3 \div 2147483647))]] = ((CHOOSE r \in [a : {1}] : TRUE) % Append((<<1, 2>> \o <<3, 1, 2>>), CASE TRUE -> 0 [] OTHER -> 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08903 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 60 to line 14, col 89 of module random_08903
---*)
