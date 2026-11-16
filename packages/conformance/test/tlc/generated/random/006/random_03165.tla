(*---
description: Evaluates a random seq expression, seed 262, number 3165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([a |-> IF <<5, 6>> THEN 1 ELSE -1, b |-> (0 = 2)] + (CHOOSE r \in [a : {1, 2}] : TRUE)), (((2 + 1))[([a |-> 1, b |-> TRUE]).a] + Cardinality({7, 2147483647}))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03165 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 26 to line 14, col 51 of module random_03165
---*)
