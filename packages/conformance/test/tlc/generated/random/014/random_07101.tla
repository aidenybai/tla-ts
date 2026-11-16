(*---
description: Evaluates a random function expression, seed 262, number 7101.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07101 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (-2), b |-> (FALSE => FALSE)]).a :> LET b10901 == ([[a |-> 1] EXCEPT !.a = @ + 0]).a IN Cardinality({b10902 \in SUBSET {1} : TRUE})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2 :> 2)"
---*)
