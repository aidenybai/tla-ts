(*---
description: Evaluates a random function expression, seed 262, number 6571.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06571 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {}] : TRUE) EXCEPT ![([[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = (-1 - 2)]).a] = ((({} \ {1}) @@ ([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1])))[(-CASE TRUE -> -1 [] OTHER -> <<1, 2>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06571 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_06571
---*)
