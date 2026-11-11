(*---
description: Evaluates a random int expression, seed 262, number 7965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((1..3 \ {x \in 1..3 : x > 1}) \cap (2..1 \ SUBSET {1})) = UNION {{b12291 : b12291 \in {}}, (FALSE \cap {x \in 1..3 : x > 1})}) -> LET b12292 == CASE (FALSE => TRUE) -> (2 * 2147483647) [] OTHER -> ((1 :> 2))[1] IN ([[a |-> 1] EXCEPT !.a = 7])[(3 * b12292)] [] OTHER -> LET b12293 == ([a |-> -1, b |-> TRUE]).a IN LET b12294 == LET b12295 == {x \in 1..3 : x > 1} IN b12293 IN (2 * b12294))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07965 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
