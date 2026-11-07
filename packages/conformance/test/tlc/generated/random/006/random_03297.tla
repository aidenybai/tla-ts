(*---
description: Evaluates a random record expression, seed 262, number 3297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((LET b5240 == 7 IN b5240 % IF FALSE THEN 1 ELSE 2) \div ((CHOOSE b5241 \in 2..1 : FALSE) % IF TRUE THEN 2 ELSE Nat)), b |-> (\E b5242 \in DOMAIN ([x \in Nat |-> x + 1] :> 2) : ((~FALSE) => (\A b5243 \in {} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03297 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 82 to line 14, col 110 of module random_03297
---*)
