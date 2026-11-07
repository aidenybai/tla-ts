(*---
description: Evaluates a random int expression, seed 262, number 9257.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09257 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF [[a |-> 1] EXCEPT !.a = @ + 2] THEN (<<3, 1, 2>> = [x \in 1..2 |-> x]) ELSE CASE TRUE -> 0 [] OTHER -> 7 + (Cardinality({1, 2}) - (CHOOSE b14368 \in {1, 2} : FALSE))) - (((7 - 2) :> ([x \in 1..2 |-> x])[1])).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09257 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 18 to line 14, col 185 of module random_09257
---*)
