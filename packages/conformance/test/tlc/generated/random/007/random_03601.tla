(*---
description: Evaluates a random int expression, seed 262, number 3601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = (CHOOSE b5683 \in {x \in 1..3 : x > 1} : TRUE)]).a \div Cardinality(((2 \div 2147483647) .. CASE FALSE -> 7 [] OTHER -> 3))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
