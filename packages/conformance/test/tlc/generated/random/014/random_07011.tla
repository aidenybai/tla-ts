(*---
description: Evaluates a random int expression, seed 262, number 7011.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07011 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b10745 == (Len(<<1>>) % LET b10746 == 2 IN 7) IN LET b10747 == IF TRUE THEN b10745 ELSE TRUE IN IF TRUE THEN 2 ELSE b10745 \div LET b10748 == CASE (FALSE /\ TRUE) -> ([x \in Nat |-> x + 1])[0] [] OTHER -> (1 + -1) IN CASE ([a |-> 1] = [a |-> 1, b |-> TRUE]) -> (3 - b10748) [] OTHER -> ((1 :> 2)).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
