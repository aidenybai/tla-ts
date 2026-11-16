(*---
description: Evaluates a random record expression, seed 262, number 5036.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05036 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ([({1, 2} @@ [x \in 1..2 |-> x]) EXCEPT ![DOMAIN [x \in Nat |-> x + 1]] = (-1 + 7)])[(-Cardinality({x \in 1..3 : x > 1}))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05036 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
