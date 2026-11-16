(*---
description: Evaluates a random function expression, seed 262, number 5820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2 - 7) + (1 - -1)) @@ ((1..3 \subseteq 2..1) => ([a |-> 1, b |-> TRUE] = [a |-> 1]))) EXCEPT ![LET b8973 == CASE ([a |-> 1, b |-> TRUE] = (1 :> 2)) -> (0 - 0) [] OTHER -> Cardinality({1}) IN IF (7 < 0) THEN LET b8974 == b8973 IN b8974 ELSE (b8973 - 0)] = (((<<5, 6>>)[0] * CASE TRUE -> 2 [] OTHER -> 1) % Head(Append(<<1, 2>>, 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05820 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    -3
---*)
