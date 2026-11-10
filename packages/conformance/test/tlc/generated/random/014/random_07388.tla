(*---
description: Evaluates a random int expression, seed 262, number 7388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (~(TRUE => FALSE)) -> LET b11372 == Len(<<1, 2>>) IN Cardinality({x \in 1..3 : x > 1}) [] OTHER -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a * ([[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = (CHOOSE b11373 \in 2 : <<5, 6>>)]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
