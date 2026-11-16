(*---
description: Evaluates a random int expression, seed 262, number 3003.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03003 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4772 == (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[Head(<<1>>)] IN IF (\A b4773 \in {1, 2} : FALSE) THEN Cardinality(1..3) ELSE (-b4772) :> ([[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = @ + (0 - 2)]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-1 :> -3)"
---*)
