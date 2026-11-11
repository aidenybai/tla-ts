(*---
description: Evaluates a random function expression, seed 262, number 5583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8647 \in [b8648 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![7] = 2147483647] |-> [[a |-> b8648, b |-> FALSE] EXCEPT !.a = CASE [a |-> 1, b |-> TRUE] -> b8648 [] OTHER -> 3]] |-> ((-(2 - b8647)) * ((b8647 % b8647) * (0 + 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 46 to line 14, col 63 of module random_05583
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05583 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 141 to line 14, col 161 of module random_05583
---*)
