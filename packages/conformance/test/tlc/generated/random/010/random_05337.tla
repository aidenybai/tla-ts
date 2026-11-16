(*---
description: Evaluates a random int expression, seed 262, number 5337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 1 ELSE 3 - (1 - 0)) :> IF (FALSE \/ 0) THEN ([x \in 1..2 |-> x])[1] ELSE ([x \in Nat |-> x + 1])[1]))[((Cardinality(SUBSET {1}) + IF [a |-> 1, b |-> TRUE] THEN 2147483647 ELSE 3) + (-(FALSE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05337 failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    an integer.
    line 14, col 60 to line 14, col 69 of module random_05337
---*)
