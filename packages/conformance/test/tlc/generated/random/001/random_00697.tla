(*---
description: Evaluates a random function expression, seed 262, number 697.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00697 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> IF (-1 = [x \in Nat |-> x + 1]) THEN (1 % 3) ELSE (CHOOSE b1162 \in [x \in 1..2 |-> x] : TRUE), b |-> (<<7, 2147483647>> = (CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))] @@ [b1163 \in (DOMAIN [x \in 1..2 |-> x] \cap ({x \in 1..3 : x > 1} \cap {2, 1, 3})) |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = [a |-> 1, b |-> TRUE]]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00697 failed.
    Attempted to check equality of integer -1 with non-integer:
    [x \in Nat |-> <expression line 14, col 48 to line 14, col 52 of module random_00697>]
---*)
