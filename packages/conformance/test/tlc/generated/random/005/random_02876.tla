(*---
description: Evaluates a random bool expression, seed 262, number 2876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1] = [a |-> 1]) \/ (~FALSE)) => (\A b4561 \in {1, 0} : (7 = 2))) => (((1 = 7) \/ (\A b4562 \in 2..1 : FALSE)) => ((~FALSE) => (0 \in {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
