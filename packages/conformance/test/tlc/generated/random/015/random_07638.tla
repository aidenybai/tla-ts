(*---
description: Evaluates a random bool expression, seed 262, number 7638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((CHOOSE b11750 \in 1..3 : TRUE) = ([a |-> 1]).a) THEN (((1 :> 2))[2147483647] + (0 .. 0)) ELSE (-Cardinality({2, 1, 3})) = IF (\A b11751 \in DOMAIN [x \in Nat |-> x + 1] : (\E b11752 \in {2, 1, 3} : [a |-> 1])) THEN ((<<5, 6>>)[1] \div Head(<<1, 2>>)) ELSE ((0 :> 7))[([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07638 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
