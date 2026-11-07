(*---
description: Evaluates a random bool expression, seed 262, number 5144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(Cardinality(1..3) :> (-1 * 3)) EXCEPT ![Head(<<2147483647, 2>>)] = (([a |-> 1, b |-> TRUE]).a % ([a |-> 1, b |-> TRUE]).a)] EXCEPT !.a = (([<<5, 6>> EXCEPT ![FALSE] = 7] @@ (CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE)))[LET b7989 == IF <<1>> THEN 2147483647 ELSE 3 IN (b7989 * b7989)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 47 of module random_05144
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05144 failed.
    Attempted to check equality of integer 3 with non-integer:
    "a"
---*)
