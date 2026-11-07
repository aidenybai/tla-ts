(*---
description: Evaluates a random function expression, seed 262, number 7594.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07594 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11685 \in (DOMAIN [[x \in 1..2 |-> x] EXCEPT ![3] = 2147483647] \ (UNION {{x \in 1..3 : x > 1}, 1..3} \ (~FALSE))) |-> IF ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] = (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)) THEN Cardinality((2 .. 7)) ELSE ((b11685 + b11685) + LET b11686 == 1 IN b11685)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 54 of module random_07594
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07594 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
