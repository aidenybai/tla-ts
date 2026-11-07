(*---
description: Evaluates a random function expression, seed 262, number 4047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF (\A b6370 \in {b6371 \in {} : FALSE} : (Nat = {})) THEN LET b6372 == [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] IN (<<5, 6>>)[3] ELSE (([a |-> 1]).a % (CHOOSE b6373 \in {1} : 1)), ((Len([a |-> 1]) :> (-7)))[([[a |-> 1] EXCEPT !.a = [x \in 1..2 |-> x]]).a]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04047 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
