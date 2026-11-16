(*---
description: Evaluates a random bool expression, seed 262, number 5756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((~TRUE) <=> (TRUE => TRUE)) <=> (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE)) /\ (Cardinality([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]) = (((1 :> 2) @@ [x \in Nat |-> x + 1]))[Cardinality({x \in 1..3 : x > 1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05756 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 18 to line 14, col 99 of module random_05756
---*)
